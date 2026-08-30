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
// Claim names synchronously, so slow browser acknowledgements never block
// discovery of other tools or a newer route. AbortSignal owns cancellation.
let retry: ReturnType<typeof setTimeout> | undefined;
let desiredRoute: Route | null = null;
let retries = 0;

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

function apply(route: Route) {
  const context = modelContext();
  if (!context) {
    // Some browser integrations inject the API after React mounts.
    if (retries++ < 100) retry = setTimeout(() => {
      retry = undefined;
      if (desiredRoute !== null) apply(desiredRoute);
    }, 100);
    return;
  }
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
    registered.set(name, controller);
    const onError = (error: unknown) => {
      if (registered.get(name) !== controller) return;
      registered.delete(name);
      controller.abort();
      console.error(`[webmcp] could not register ${name}`, error);
    };
    try {
      /**
       * The hints go in `annotations`, which is where the specification puts
       * them. They are mirrored at the top level as well because Chrome's
       * origin-trial build reads them from there, and a dictionary member it
       * does not know is ignored rather than rejected.
       */
      const registration = context.registerTool({
        ...rest,
        readOnlyHint,
        untrustedContentHint,
        annotations: { readOnlyHint: readOnlyHint === true, untrustedContentHint: untrustedContentHint === true },
        execute: guard(name, required, execute),
      }, { signal: controller.signal });
      Promise.resolve(registration).catch(onError);
    } catch (error) {
      // One tool refused must not cost the screen the rest of its set.
      onError(error);
    }
  }
}

/** Register the tools this screen supports. Safe to call on every update. */
export function syncWebmcpTools(route: Route): void {
  desiredRoute = route;
  retries = 0;
  clearTimeout(retry);
  retry = undefined;
  apply(route);
}

/** Drop every registration — the app is unmounting. */
export function stopWebmcpTools(): void {
  desiredRoute = null;
  clearTimeout(retry);
  retry = undefined;
  for (const name of Array.from(registered.keys())) drop(name);
}

/** Names submitted to the browser, including pending acknowledgements. */
export const registeredToolNames = () => Array.from(registered.keys());

export { TOOLS, toolsForRoute } from "./tools";
export { webmcpAvailable } from "./webmcpApi";
