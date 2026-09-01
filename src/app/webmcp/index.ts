// ADR 0012: the demo exposes a small, stable WebMCP tool set.
// docs/decisions/0012-stable-webmcp-demo-registry.md
/**
 * Registration lifecycle for the Rigsmith WebMCP tools.
 *
 * The judge-facing demo registers one small, stable set once. Handlers still
 * validate the live controller state when called, while the screen can move
 * through the catalogue with the explicit `show_in_catalog` tool. Keeping the
 * registry stable avoids a remove/add cycle on every route change.
 *
 * A tool is dropped by aborting the `AbortSignal` it was registered with,
 * which is the lifecycle primitive exposed by the current WebMCP API.
 *
 * Nothing here assumes WebMCP exists: without it the shop runs unchanged.
 *
 * https://webmachinelearning.github.io/webmcp/
 */
import { demoTools } from "./tools";
import { fail } from "./toolResult";
import { modelContext } from "./webmcpApi";
import type { ToolCallResult, ToolExecuteOptions } from "./webmcpApi";

/** Live registrations, each with the controller that withdraws it. */
const registered = new Map<string, AbortController>();
// Claim names synchronously, so slow browser acknowledgements never block
// discovery of other tools or a newer route. AbortSignal owns cancellation.
let retry: ReturnType<typeof setTimeout> | undefined;
let started = false;
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
  execute: (args: Record<string, any>, options?: ToolExecuteOptions) => Promise<ToolCallResult> | ToolCallResult,
) =>
  async (args: Record<string, any>, options?: ToolExecuteOptions): Promise<ToolCallResult> => {
    const given = args ?? {};
    const missing = required.filter(key => given[key] === undefined || given[key] === null);
    if (missing.length) return fail("missing_argument", `Required: ${missing.join(", ")}.`);
    try {
      return await execute(given, options);
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

function apply() {
  const context = modelContext();
  if (!context) {
    // Some browser integrations inject the API after React mounts.
    if (retries++ < 100) retry = setTimeout(() => {
      retry = undefined;
      if (started) apply();
    }, 100);
    return;
  }
  const wanted = new Map(demoTools().map(tool => [tool.name, tool]));
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

/** Register the stable demo set. Route changes do not churn the registry. */
export function syncWebmcpTools(): void {
  started = true;
  retries = 0;
  clearTimeout(retry);
  retry = undefined;
  apply();
}

/** Drop every registration — the app is unmounting. */
export function stopWebmcpTools(): void {
  started = false;
  clearTimeout(retry);
  retry = undefined;
  for (const name of Array.from(registered.keys())) drop(name);
}

/** Names submitted to the browser, including pending acknowledgements. */
export const registeredToolNames = () => Array.from(registered.keys());

export { TOOLS, DEMO_TOOL_NAMES, demoTools, toolsForRoute } from "./tools";
export { webmcpAvailable } from "./webmcpApi";
