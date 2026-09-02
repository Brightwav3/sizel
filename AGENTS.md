# Rigsmith agent instructions
### First, this projects working name is Rigsmith, however, its identity, is Sizel.
This file defines the default working rules for AI coding agents operating in
this repository. Read [`docs/CODEBASE_MAP.md`](docs/CODEBASE_MAP.md) before
making changes that cross more than one area.

Project-specific instructions may extend these rules. A more specific
`AGENTS.md` in a child directory takes precedence over this file.

## Repository rules

- Inspect the relevant code, tests, and existing architecture before editing.
- Keep changes focused. Do not perform unrelated refactors or add abstractions
  when an existing mechanism is sufficient.
- Preserve public URLs, catalog IDs, DOM contracts, and existing behavior
  unless the request explicitly changes them.
- Keep domain rules in `src/entities`, catalog adapters and fixtures in
  `src/data`, route experiences in `src/features`, and app composition in
  `src/app`.
- Keep persistent shell and reusable primitives in `src/shared`.
- Keep feature CSS beside its feature. Put responsive grid rules in
  `src/shared/styles/responsive.css` and design tokens in `src/_ds`.
- `AppState.picks` is the single owner of the active PC build. UI and WebMCP
  actions must use the existing `RigsmithApp` mutation paths.
- Do not introduce secrets, credentials, or unnecessary dependencies.
- Preserve unrelated user changes already present in the worktree.

## PC building without WebMCP

The structured WebMCP workflow may use catalog facts directly because its
selection tools validate stock, compatibility, and budget at commit time. A
visual/browser agent does not have that structured inspection path, so it must
use the storefront UI as an evidence-first workflow:

1. Open the product detail page for every candidate part before selecting it;
   clicking only a listing row or relying on its short spec chips is not enough.
2. Read the **Specifications** section and record the values needed for the
   decision (for example socket, memory type, interface, dimensions/clearance,
   and power), plus price and availability.
3. Compare those values with the parts already chosen. If a required value is
   missing or unclear, do not guess: inspect another candidate or ask for help.
4. Return to the builder, select the verified part, and re-check the builder's
   compatibility and budget status before moving to the next slot.

This rule applies only when WebMCP is unavailable. It does not change the
optional-inspection contract documented in `docs/decisions/0009-inspection-is-optional.md`.

## Before and after changes

1. Inspect the relevant implementation and its tests.
2. Make the smallest coherent change.
3. Add or update a regression test when the behavior is testable.
4. Run the narrowest relevant tests, then the broader checks when practical.
5. Do not claim success without reporting what was actually verified.

## Commands

```bash
npm run test
npm run build
npm run check:catalog
npm run audit:catalog
```

Use `npm run dev` for local UI work. The project uses Vite, React 19,
TypeScript, and Vitest. There is no lint script in `package.json`; do not
invent one as a required check.

## Git workflow

- Use a focused branch for substantial work, normally with a `codex/` prefix.
- Prefer Conventional Commit messages such as `fix(catalog): prevent mobile card overflow`.
- Keep commits logically scoped. Never use destructive reset or checkout
  commands to discard work unless the user explicitly requests it.

## Documentation

- Update [`docs/CODEBASE_MAP.md`](docs/CODEBASE_MAP.md) when ownership,
  routing, commands, or major data flow changes.
- Update [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) when a state ownership,
  runtime composition, or cross-cutting architecture decision changes.
- Record durable architectural decisions in `docs/decisions/`.
