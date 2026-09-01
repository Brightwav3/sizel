import { writeFileSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
// Tool metadata imports the controller; styles have no role in this CLI.
registerHooks({ load(url, context, nextLoad) {
  return url.endsWith('.css') ? { format: 'module', source: 'export {};', shortCircuit: true } : nextLoad(url, context);
} });
const { TOOLS, DEMO_TOOL_NAMES } = await import('../src/app/webmcp/tools.ts');

const table = TOOLS.map(tool => `| \`${tool.name}\` | ${tool.readOnlyHint ? 'read' : 'write'} | ${tool.routes.join(', ') || 'all'} | ${((tool.inputSchema.required) ?? []).join(', ') || '—'} |`).join('\n');
const sections = TOOLS.map(tool => {
  const fields = Object.entries(tool.inputSchema.properties)
    .map(([name, field]) => `| \`${name}\` | ${field.type} | ${field.description ?? ''}${field.enum ? ` Values: ${field.enum.join(', ')}.` : ''} |`).join('\n');
  return `### \`${tool.name}\`\n\n${tool.description}\n\n${fields ? `| Parameter | Type | Meaning |\n| --- | --- | --- |\n${fields}` : 'No parameters.'}`;
}).join('\n\n');
const sources = ['src/app/webmcp/tools.ts', 'src/app/webmcp/compareBuildOptions.ts', 'src/app/App.tsx', 'src/entities/build/selection.ts', 'src/entities/cart/cartValidation.ts'];
const errors = new Set(sources.flatMap(path => [...readFileSync(path, 'utf8').matchAll(/(?:fail|new ShopError)\(["']([a-z_]+)["']/g)].map(match => match[1])));
const guide = `# WebMCP tool reference

Generated with \`npx tsx scripts/generate-webmcp-docs.mjs\`. **${TOOLS.length} descriptors** are implemented; **${DEMO_TOOL_NAMES.length}** are exposed by the stable judge-facing demo registry.

## Agent selects the build

1. Call \`begin_build\` with the shopper brief and exact USD budget. This opens the existing builder. If the shopper gives slot shares, pass \`budgetShares\` such as \`{cpu: 20, gpu: 40}\`; the response returns dollar hints for every slot and allocates the remainder by resolution. For a guided fast path, pass \`starter: "balanced"\`: it fills only compatible, in-stock non-GPU support parts and leaves the GPU unchosen. Existing selections remain unless reset is explicitly requested.
2. Search products. For a PC, \`list_compatible_parts\` can return one slot, a bounded \`slots\` batch or \`allRemaining\`, with the current slot allowance and optional \`maxPrice\`, \`sort\` and compact details. For the focused GPU decision, pass \`mode: "ranked"\`, \`slot: "gpu"\` and an optional \`maxPrice\`; it returns the strongest fictional-game-simulation primary, the next in-stock fallback and a watchdog gate when the real listing qualifies. Use \`inspect_build_options\` only when more facts or a focused comparison are needed; it is not required before selection.
3. Choose a product with \`set_build_component\` using slot and productId. Reason, tradeoff and alternativeId are optional notes. Explain material tradeoffs in conversation. Current stock, fit and budget are validated on every selection, without requiring reinspection after changes.
4. Repeat for the remaining slots; choosing a case includes its fans. Read \`check_build_compatibility\` to verify the complete build, stock and budget. Cart and checkout remain separate requested actions.
5. Maximize benefit for shopper use within the whole budget, not savings by default. Use \`compare_build_options\` with a relevant upgrade near the limit, especially GPU for gaming. Derive component price limits from the rest of the build rather than arbitrary caps. Choose the same fictional scenario for all options and explain assumptions. Apply your own changes and compare again. Explain unused budget; missing data are not proof of equal performance.

\`recommend_build\` has been removed. The optional balanced starter is a user-visible shortcut for non-GPU support parts, not an automatic whole-build recommendation: the agent still chooses the GPU and may replace any starter part. The site cannot prove an agent understands a component or that every sentence it writes is true. Inspection and explanation fields are optional; domain safety checks remain mandatory. See ADR 0009. Reuse tool definitions while the document and available tool set are unchanged; selection does not itself require schema rediscovery.

## Contract and limits

Game-labeled simulation: pass \`game\` as \`counter-strike-2\`, \`fortnite\` or \`cyberpunk-2077\` to \`estimate_performance\` or \`compare_build_options\`. Do not combine it with \`scenario\`. Results identify the fixed preset and \`rigsmith-game-simulation-v2\` dataset. Protocols are Counter-Strike 2 Very High native raster; Fortnite Ultra DX12 with 100% TAA, Nanite off, hardware RT off and software Lumen enabled; and Cyberpunk 2077 Ultra native raster. All use no upscaling or frame generation. GPU average-FPS anchors are calibrated against cited external reviews where comparable; other GPU tiers are simulated scaling, while 1% lows and CPU/build limits remain authored simulation inputs. These are simulated fixtures, not measured or predicted real-game FPS. CPU pages expose no game-performance widget. See ADR 0011.

UI and tools share controller commands for selections, quantity, build cart admission and checkout. Commands finish after React commits. Builds must be complete, have no known compatibility conflict, be available and fit the hard budget. Quantity is a whole number, at most five per product line, also bounded by stock across product and build lines. Zero removes a line. Checkout always opens at delivery after revalidation.

Catalog prices, stock and reviews are synthetic. Measured FPS and noise remain unavailable. Separately, \`estimate_performance\` and \`compare_build_options\` return versioned, explicitly labeled simulated benchmarks for competitive or cinematic workloads. These use authored category fixtures and an explicit CPU/GPU minimum-ceiling protocol, not the old clock/core formula. GPU averages use calibrated review anchors only for comparable source protocols; unmeasured tiers, 1% lows, CPU limits and whole-build limits remain fictional. Storage loading time is separate from FPS. See ADR 0010 and the category benchmark documents. Simulation can support choices inside the fictional scenario, never real-world performance claims. Seven compatibility rules are implemented; a pass is not complete physical/BIOS certification. Checkout is a preview only, without payment or orders.

Read-only tools do not move the UI; \`show_in_catalog\`, \`begin_build\`, \`inspect_build_options\` and selection do. The demo registers a stable allowlist from \`DEMO_TOOL_NAMES\`; route changes do not churn it. Results normally have a 1500-character budget; build reports use 3000, read snapshots and candidate inspection 6000. Truncated lists disclose omitted entries. Candidate inspection never drops candidates to fit: oversized responses require fewer candidates. Agent reasons stay in command state; there is no additional explanation panel in the storefront. Existing build lines track the editable build, and are revalidated before checkout.

## Tools

| Tool | Kind | Screens | Required |
| --- | --- | --- | --- |
${table}

${sections}

## Errors

Errors are JSON with \`error\` and a recovery \`hint\`; command failures do not mutate the intended domain state. Known codes: ${[...errors].sort().map(code => `\`${code}\``).join(', ')}, \`command_failed\`, \`tool_failed\`, \`result_too_large\`, \`section_unavailable\`, \`section_too_large\`, \`invalid_ids\`, \`not_enough_matches\`.
`;
writeFileSync('docs/webmcp-tools.md', guide);
