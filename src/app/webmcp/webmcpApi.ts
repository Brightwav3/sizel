/**
 * The slice of the WebMCP imperative API this app uses, plus feature
 * detection. The API is an origin-trial proposal, so nothing here may assume
 * it exists: every call site goes through `modelContext()`.
 *
 * https://github.com/webmachinelearning/webmcp
 */

export interface ToolTextContent { type: "text"; text: string }
export interface ToolCallResult { content: ToolTextContent[]; isError?: boolean }

/** MCP tool annotations. Chrome reads them top level; MCP nests them. */
export interface ToolAnnotations {
  /** The tool never changes state, so an agent may call it without asking. */
  readOnlyHint?: boolean;
  /** The payload carries user-generated or external data. Treat with scrutiny. */
  untrustedContentHint?: boolean;
}

export interface ToolDescriptor extends ToolAnnotations {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: ToolAnnotations;
  execute(args: Record<string, any>): Promise<ToolCallResult> | ToolCallResult;
}

interface ModelContext {
  registerTool(descriptor: ToolDescriptor, options?: { exposedTo?: string[] }): Promise<unknown> | unknown;
  unregisterTool?(name: string): Promise<unknown> | unknown;
}

/** The live model context, or null when the browser has no WebMCP. */
export function modelContext(): ModelContext | null {
  const context = (document as any).modelContext;
  return context && typeof context.registerTool === "function" ? context as ModelContext : null;
}

export const webmcpAvailable = () => modelContext() !== null;
