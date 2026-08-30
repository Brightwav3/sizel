import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TOOLS } from "./tools";

/**
 * Documentation drifts silently. A tool added to the code and forgotten in the
 * README reads, to anyone judging or joining the project, as a tool that does
 * not exist — and a tool removed from the code but left in the README is a
 * promise the app cannot keep. These tests fail the build for either.
 */
const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

const NAMES = TOOLS.map(tool => tool.name).sort();

describe("README", () => {
  const readme = read("README.md");

  it("lists every registered tool, and no tool that is not registered", () => {
    const listed = Array.from(readme.matchAll(/^\| `([a-z_]+)` \| /gm)).map(match => match[1]).sort();
    expect(listed).toEqual(NAMES);
  });

  it("states the tool count the code actually registers", () => {
    const written = readme.match(/^([A-Z][a-z-]+(?:-[a-z]+)?) tools are registered/m)?.[1];
    const words: Record<string, number> = {
      Nineteen: 19, "Twenty-seven": 27, "Thirty-three": 33, "Thirty-four": 34, "Thirty-five": 35,
    };
    expect(written, "tool count sentence not found in README").toBeDefined();
    expect(words[written!], `README says "${written}"`).toBe(TOOLS.length);
  });
});

describe("docs/webmcp-tools.md", () => {
  const reference = read("docs/webmcp-tools.md");

  it("gives every tool its own section", () => {
    const documented = Array.from(reference.matchAll(/^### `([a-z_]+)`$/gm)).map(match => match[1]).sort();
    expect(documented).toEqual(NAMES);
  });

  it("puts every tool in the summary table with its screens", () => {
    const rows = Array.from(reference.matchAll(/^\| `([a-z_]+)` \| (read|write)/gm));
    expect(rows.map(row => row[1]).sort()).toEqual(NAMES);
    for (const [, name, kind] of rows) {
      const tool = TOOLS.find(entry => entry.name === name)!;
      expect(kind === "read", name).toBe(tool.readOnlyHint === true);
    }
  });

  it("documents every error code a tool can return", () => {
    const source = read("src/app/webmcp/tools.ts");
    const codes = new Set(Array.from(source.matchAll(/fail\("([a-z_]+)"/g)).map(match => match[1]));
    for (const code of codes) expect(reference, code).toContain(`\`${code}\``);
  });
});
