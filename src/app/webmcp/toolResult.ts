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
// A multi-section snapshot replaces several separate round trips (ADR 0006).
export const SNAPSHOT_OUTPUT_BUDGET = 6000;
// A compatibility batch is deliberately compact, but can contain up to ten
// candidates for each of the nine build slots. Keeping this separate from the
// ordinary snapshot ceiling makes `limit` honest instead of silently reducing
// it to two candidates.
export const BATCH_CANDIDATE_OUTPUT_BUDGET = 18000;
/**
 * The full build report: nine slots, each with its own availability, plus
 * totals, compatibility, clearance and power.
 *
 * Deliberately above the ordinary ceiling. The alternative an agent reaches
 * for when a slot is missing is one `check_stock` per part, which costs far
 * more context than the extra characters here, so completeness is bought
 * once rather than nine times.
 */
export const BUILD_REPORT_BUDGET = 3000;

const json = (payload: unknown) => JSON.stringify(payload);

/**
 * A successful result. `listKey` names the array to shorten when the payload
 * is too long; without it an oversized payload is reported as such instead of
 * being cut somewhere arbitrary.
 */
export function ok(
  payload: Record<string, any>,
  listKey?: string,
  /**
   * Fields derived from the list, applied after any shortening.
   *
   * A note that says "some of these are out of stock" is a lie once the
   * shortening has dropped every out-of-stock row, so anything computed from
   * the list is computed from the list that is actually sent.
   */
  summarise?: (items: any[]) => Record<string, any>,
  /** Character ceiling for this result. Defaults to the ordinary tool budget. */
  budget: number = OUTPUT_BUDGET,
): ToolCallResult {
  // Always derived from the base payload, never layered over a previous pass,
  // so a note dropped by a shorter list does not survive into the next one.
  const base = payload;
  const apply = (list?: unknown[], omitted?: number) => {
    const next: Record<string, any> = list && listKey
      ? { ...base, [listKey]: list, ...(omitted ? { omitted } : {}) }
      : { ...base };
    return summarise && listKey && Array.isArray(next[listKey])
      ? { ...next, ...summarise(next[listKey]) }
      : next;
  };

  payload = apply();
  let body = json(payload);
  if (body.length > budget && listKey && Array.isArray(base[listKey])) {
    const items = base[listKey] as unknown[];
    let keep = items.length;
    while (keep > 1 && body.length > budget) {
      keep = Math.max(1, Math.floor(keep * 0.6));
      payload = apply(items.slice(0, keep), items.length - keep);
      body = json(payload);
    }
  }
  if (body.length > budget) {
    body = json({ error: "result_too_large", hint: "Ask for fewer items or one product by id." });
  }
  return { content: [{ type: "text", text: body }] };
}

/** A failure the agent can act on: always a reason, and where possible a way out. */
export function fail(error: string, hint?: string): ToolCallResult {
  return { content: [{ type: "text", text: json(hint ? { error, hint } : { error }) }], isError: true };
}
