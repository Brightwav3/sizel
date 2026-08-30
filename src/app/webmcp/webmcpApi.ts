/**
 * The slice of the WebMCP imperative API this app uses, plus feature
 * detection. The API is an origin-trial proposal, so nothing here may assume
 * it exists: every call site goes through `modelContext()`.
 *
 * https://github.com/webmachinelearning/webmcp
 */

export interface ToolTextContent { type: "text"; text: string }
export interface ToolCallResult { content: ToolTextContent[]; isError?: boolean }

/**
 * Tool annotations, as `ToolAnnotations` in the specification. They belong
 * under `annotations`; Chrome's origin-trial build also reads them from the
 * top level, so registration sends both.
 */
export interface ToolAnnotations {
  /** The tool never changes state, so an agent may call it without asking. */
  readOnlyHint?: boolean;
  /** The payload carries user-generated or external data. Treat with scrutiny. */
  untrustedContentHint?: boolean;
}

export interface ToolDescriptor extends ToolAnnotations {
  name: string;
  /** Shown in the agent's own UI. May be rendered natively. */
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** Where the specification puts the hints. */
  annotations?: ToolAnnotations;
  execute(args: Record<string, any>): Promise<ToolCallResult> | ToolCallResult;
}

/**
 * `registerTool` is the whole surface this app needs. There is no
 * `unregisterTool` in the specification: a registration is withdrawn by
 * aborting the `AbortSignal` passed in `options`.
 */
interface ModelContext {
  registerTool(
    descriptor: ToolDescriptor,
    options?: { exposedTo?: string[]; signal?: AbortSignal },
  ): Promise<unknown> | unknown;
}

/** The live model context, or null when the browser has no WebMCP. */
export function modelContext(): ModelContext | null {
  const context = (document as any).modelContext;
  return context && typeof context.registerTool === "function" ? context as ModelContext : null;
}

export const webmcpAvailable = () => modelContext() !== null;
