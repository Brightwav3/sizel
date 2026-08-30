/**
 * Tool results, shaped to the WebMCP character budgets.
 *
 * Chrome's guidance is 1.5K characters per tool output; past that an agent's
 * own guardrails start truncating for us, in the middle of a JSON document.
 * So results are compact JSON, and any list they carry is shortened here
 * rather than by the agent, with an explicit note of what was left out.
 *
 * https://developer.chrome.com/docs/ai/webmcp/secure-tools
 */
import type { ToolCallResult } from "./webmcpApi";

export const OUTPUT_BUDGET = 1500;

const json = (payload: unknown) => JSON.stringify(payload);

/**
 * A successful result. `listKey` names the array to shorten when the payload
 * is too long; without it an oversized payload is reported as such instead of
 * being cut somewhere arbitrary.
 */
export function ok(payload: Record<string, any>, listKey?: string): ToolCallResult {
  let body = json(payload);
  if (body.length > OUTPUT_BUDGET && listKey && Array.isArray(payload[listKey])) {
    const items = payload[listKey] as unknown[];
    let keep = items.length;
    while (keep > 1 && body.length > OUTPUT_BUDGET) {
      keep = Math.max(1, Math.floor(keep * 0.6));
      payload = { ...payload, [listKey]: items.slice(0, keep), omitted: items.length - keep };
      body = json(payload);
    }
  }
  if (body.length > OUTPUT_BUDGET) {
    body = json({ error: "result_too_large", hint: "Ask for fewer items or one product by id." });
  }
  return { content: [{ type: "text", text: body }] };
}

/** A failure the agent can act on: always a reason, and where possible a way out. */
export function fail(error: string, hint?: string): ToolCallResult {
  return { content: [{ type: "text", text: json(hint ? { error, hint } : { error }) }], isError: true };
}
