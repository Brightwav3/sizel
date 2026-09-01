import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEMO_TOOL_NAMES, TOOLS } from "./tools";

/**
 * Documentation drifts silently. A tool added to the code and forgotten in the
 * README reads, to anyone judging or joining the project, as a tool that does
 * not exist — and a tool removed from the code but left in the README is a
 * promise the app cannot keep. These tests fail the build for either.
 */
const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const NAMES = TOOLS.map(tool => tool.name).sort();
const DEMO_NAMES = [...DEMO_TOOL_NAMES].sort();
const DEMO_ERROR_CODES = [
  "build_incompatible", "build_incomplete", "category_required",
  "conflicting_arguments", "conflicting_workload", "duplicate_alternative",
  "filters_require_one_slot", "insufficient_stock", "invalid_alternative",
  "invalid_alternatives", "invalid_brief", "invalid_budget",
  "invalid_budget_allocation", "invalid_game", "invalid_mode",
  "invalid_quantity", "invalid_reason", "invalid_scenario", "invalid_slot",
  "missing_argument", "no_compatible_gpu", "out_of_stock", "over_budget",
  "product_not_found", "ranked_requires_gpu", "unknown_filter", "wrong_fan_pack", "wrong_slot",
  "command_failed", "tool_failed", "result_too_large",
].sort();

describe("README", () => {
  const readme = read("README.md");

  it("lists every registered tool, and no tool that is not registered", () => {
    const listed = Array.from(readme.matchAll(/^\| `([a-z_]+)` \| /gm)).map(match => match[1]).sort();
    expect(listed).toEqual(NAMES);
  });

  it("states both the implemented and demo-exposed tool counts", () => {
    const written = readme.match(/^([A-Z][a-z-]+(?:-[a-z]+)?) tool descriptors are implemented/m)?.[1];
    const demoWritten = readme.match(/registers ([a-z-]+) stable tools/m)?.[1];
    const words: Record<string, number> = {
      Thirteen: 13, Nineteen: 19, "Twenty-seven": 27, "Thirty-three": 33, "Thirty-four": 34, "Thirty-five": 35, "Thirty-six": 36,
    };
    expect(written, "implemented tool count sentence not found in README").toBeDefined();
    expect(words[written!], `README says "${written}"`).toBe(TOOLS.length);
    expect(demoWritten, "demo tool count sentence not found in README").toBeDefined();
    expect(words[`${demoWritten![0].toUpperCase()}${demoWritten!.slice(1)}`], `README says "${demoWritten}"`).toBe(DEMO_TOOL_NAMES.length);
  });
});

describe("docs/webmcp-tools.md", () => {
  const reference = read("docs/webmcp-tools.md");

  it("gives every demo tool its own section and omits non-demo tools", () => {
    const documented = Array.from(reference.matchAll(/^### `([a-z_]+)`$/gm)).map(match => match[1]).sort();
    expect(documented).toEqual(DEMO_NAMES);
  });

  it("puts every tool in the summary table with its screens", () => {
    const rows = Array.from(reference.matchAll(/^\| `([a-z_]+)` \| (read|write)/gm));
    expect(rows.map(row => row[1]).sort()).toEqual(DEMO_NAMES);
    for (const [, name, kind] of rows) {
      const tool = TOOLS.find(entry => entry.name === name)!;
      expect(kind === "read", name).toBe(tool.readOnlyHint === true);
    }
  });

  it("documents every error code a tool can return", () => {
    for (const code of DEMO_ERROR_CODES) expect(reference, code).toContain(`\`${code}\``);
  });
});
