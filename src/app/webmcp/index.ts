// ADR 0006: tool definitions live in src/app/webmcp and follow the route.
// docs/decisions/0006-webmcp-tools-follow-the-screen.md
/**
 * Registration lifecycle for the Rigsmith WebMCP tools.
 *
 * Tools follow the screen. An agent on the cart should not be offered a tool
 * that edits a build it cannot see, and a smaller tool set is a clearer one,
 * so every route change registers what the screen supports and drops the rest.
 *
 * A tool is dropped by aborting the `AbortSignal` it was registered with,
 * which is the only way the specification offers — there is no
 * `unregisterTool`. That matters here: `registerTool` rejects when a name is
 * already taken, so a registration that could not be withdrawn would make
 * every later route change fail.
 *
 * Nothing here assumes WebMCP exists: without it the shop runs unchanged.
 *
 * https://webmachinelearning.github.io/webmcp/
 */
import type { Route } from "../../shared/lib/types";
import { toolsForRoute } from "./tools";
import { fail } from "./toolResult";
import { modelContext } from "./webmcpApi";
import type { ToolCallResult } from "./webmcpApi";

/** Live registrations, each with the controller that withdraws it. */
const registered = new Map<string, AbortController>();
/** Registrations are serialised: two route changes must not interleave. */
let queue: Promise<void> = Promise.resolve();

/**
 * A handler never throws at the agent. A thrown error reaches it as an opaque
 * failure it cannot act on, so every fault comes back as a stated reason —
 * including a missing argument, which is named rather than left to surface as
 * whatever the handler happened to dereference first.
 */
const guard = (
  name: string,
  required: string[],
  execute: (args: Record<string, any>) => Promise<ToolCallResult> | ToolCallResult,
) =>
  async (args: Record<string, any>): Promise<ToolCallResult> => {
    const given = args ?? {};
    const missing = required.filter(key => given[key] === undefined || given[key] === null);
    if (missing.length) return fail("missing_argument", `Required: ${missing.join(", ")}.`);
    try {
      return await execute(given);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`[webmcp] ${name} failed`, error);
      return fail("tool_failed", reason.slice(0, 140));
    }
  };

function drop(name: string) {
  registered.get(name)?.abort();
  registered.delete(name);
}

async function apply(route: Route) {
  const context = modelContext();
  if (!context) return;
  const wanted = new Map(toolsForRoute(route).map(tool => [tool.name, tool]));

  for (const name of Array.from(registered.keys())) {
    if (!wanted.has(name)) drop(name);
  }
  for (const [name, tool] of wanted) {
    if (registered.has(name)) continue;
    const { routes, execute, readOnlyHint, untrustedContentHint, ...rest } = tool;
    void routes;
    const controller = new AbortController();
    const required = ((tool.inputSchema as any).required ?? []) as string[];
    try {
      /**
       * The hints go in `annotations`, which is where the specification puts
       * them. They are mirrored at the top level as well because Chrome's
       * origin-trial build reads them from there, and a dictionary member it
       * does not know is ignored rather than rejected.
       */
      await context.registerTool({
        ...rest,
        readOnlyHint,
        untrustedContentHint,
        annotations: { readOnlyHint: readOnlyHint === true, untrustedContentHint: untrustedContentHint === true },
        execute: guard(name, required, execute),
      }, { signal: controller.signal });
      registered.set(name, controller);
    } catch (error) {
      // One tool refused must not cost the screen the rest of its set.
      console.error(`[webmcp] could not register ${name}`, error);
    }
  }
}

/** Register the tools this screen supports. Safe to call on every update. */
export function syncWebmcpTools(route: Route): void {
  queue = queue.then(() => apply(route)).catch(error => console.error("[webmcp] registration failed", error));
}

/** Drop every registration — the app is unmounting. */
export function stopWebmcpTools(): void {
  queue = queue.then(() => {
    for (const name of Array.from(registered.keys())) drop(name);
  }).catch(error => console.error("[webmcp] teardown failed", error));
}

/** Tool names live on the page right now, for diagnostics. */
export const registeredToolNames = () => Array.from(registered.keys());

export { TOOLS, toolsForRoute } from "./tools";
export { webmcpAvailable } from "./webmcpApi";
