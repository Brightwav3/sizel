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
const WEBMCP_TIMINGS_KEY = "__rigsmithWebmcpTimings";
type WebmcpTiming = { name: string; ms: number; outcome: "ok" | "error" };
let userHasControl = false;
let controlRevision = 0;
let agentSessionActive = false;

const timingNow = () => typeof performance !== "undefined" ? performance.now() : Date.now();

/**
 * Record handler-only duration. This intentionally excludes model planning,
 * browser transport, registration and UI paint time, which lets the demo
 * distinguish local handler work from WebMCP/client overhead.
 */
function recordTiming(name: string, startedAt: number, outcome: WebmcpTiming["outcome"]) {
  if (typeof window === "undefined") return;
  const target = window as Window & { [WEBMCP_TIMINGS_KEY]?: WebmcpTiming[] };
  const ms = Math.round((timingNow() - startedAt) * 100) / 100;
  target[WEBMCP_TIMINGS_KEY] = [...(target[WEBMCP_TIMINGS_KEY] ?? []), { name, ms, outcome }].slice(-200);
  const query = typeof window.location?.search === "string" ? new URLSearchParams(window.location.search) : null;
  if (query?.get("debugWebMcp") === "1") console.info(`[webmcp timing] ${name}: ${ms}ms (${outcome})`);
}
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
    const startedAt = timingNow();
    const given = args ?? {};
    if (userHasControl) {
      const result = fail("user_control", "The shopper navigated to another page and took control. Stop making changes until the shopper asks you to continue.");
      recordTiming(name, startedAt, "error");
      return result;
    }
    if (options?.signal?.aborted) {
      const result = fail("action_cancelled", "The shopper cancelled this agent action.");
      recordTiming(name, startedAt, "error");
      return result;
    }
    const actionRevision = controlRevision;
    const missing = required.filter(key => given[key] === undefined || given[key] === null);
    if (missing.length) {
      const result = fail("missing_argument", `Required: ${missing.join(", ")}.`);
      recordTiming(name, startedAt, "error");
      return result;
    }
    try {
      agentSessionActive = true;
      const result = await execute(given, options);
      if (userHasControl || actionRevision !== controlRevision || options?.signal?.aborted) {
        const cancelled = fail("user_control", "The shopper navigated away and took control before this agent action finished.");
        recordTiming(name, startedAt, "error");
        return cancelled;
      }
      recordTiming(name, startedAt, result.isError ? "error" : "ok");
      return result;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`[webmcp] ${name} failed`, error);
      recordTiming(name, startedAt, "error");
      return fail("tool_failed", reason.slice(0, 140));
    }
  };

function drop(name: string) {
  registered.get(name)?.abort();
  registered.delete(name);
}

function apply() {
  if (userHasControl) return;
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
  if (userHasControl) return;
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

/** Withdraw every tool after the agent has started working and block later calls. */
export function takeUserControl(): boolean {
  if (userHasControl || !agentSessionActive) return false;
  userHasControl = true;
  controlRevision += 1;
  stopWebmcpTools();
  return true;
}

/** Names submitted to the browser, including pending acknowledgements. */
export const registeredToolNames = () => Array.from(registered.keys());

export { TOOLS, DEMO_TOOL_NAMES, demoTools, toolsForRoute } from "./tools";
export { webmcpAvailable } from "./webmcpApi";
