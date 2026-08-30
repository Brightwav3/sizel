# ADR 0004: The port's inline style strings are removed; styling lives in CSS

- **Status:** Accepted
- **Date:** 2026-08-30
- **Decision owners:** Rigsmith project

## Context

The React app was originally a port of an HTML prototype that styled every element with an inline CSS declaration string and a `style-hover="…"` attribute. `sx()` parsed one of those strings into the object React wants, and `useHover()` reproduced the hover attribute in React state.

Keeping the strings verbatim — byte for byte — was what made the port reviewable: any component could be diffed against the prototype it came from, and a visual regression could be traced to a single changed declaration. Retyping several hundred declarations as camelCase objects would have lost that, exactly when the port was least trustworthy.

The port is complete, so the property that justified the bridge — a live prototype to diff against — no longer earns its cost. What remained was real:

- Every render re-parsed the strings.
- Declarations were invisible to the stylesheet, so no media query, pseudo-class, or pseudo-element could reach them. `responsive.css` already carried a `.topbar-grid` padding override that the inline `padding` silently beat, so the rule never applied.
- Hover was React state, so a pointer crossing a product card re-rendered it.
- The same declaration string was repeated per instance — five copies of one section header on the home page, one add-to-cart string per listing.

## Decision

`sx()` and `useHover()` are deleted. All 197 call sites across six components are styled from CSS files beside them and the tokens in `src/_ds`, following the BEM naming the already-migrated components use.

Two rules govern what stayed inline:

- **Per-instance values** — a colour, a dim, a grid span that varies per listing — are passed as CSS custom properties set on the element, and consumed by the class.
- **Values that must beat a class** stay as genuine React style objects. `motion.css` sets `transform` from `.t-panel-slide[data-open="true"]` and `opacity` from `.t-toast.is-open`; both outrank a single class, so the floating build card's drag position and the toast's fade remain inline. Those are per-instance values, which is what inline style is for.

Selectors that override `.card` or `.ph` from `styles.css` are compounded (`.card.promo-card`) so they win on specificity rather than on import order. Base values that a media query overrides live in `responsive.css` next to that query, not split across two files.

## Rejected alternatives

- **Keep the bridge and document it as debt:** rejected once the work was scoped — the migration is mechanical per component and verifiable screen by screen, and a documented bridge is still a bridge that new code copies.
- **Hoist the parsed objects to module scope:** would remove the per-render parse but keep styling out of the stylesheet, which is the larger cost.
- **Generate one class per unique declaration string mechanically:** rejected because inline styles outrank classes, so a mechanical lift would have silently changed which rule wins wherever an existing selector targeted the same element — precisely the `.t-panel-slide` case above.

## Consequences

### Positive

- Styling is reachable by media queries, pseudo-classes and the cascade.
- Hover on the top bar and on every product card is a pseudo-class, not React state.
- Repeated shapes are one rule instead of one string per instance; `HomeScreen.tsx` and `CategoryScreen.tsx` lost roughly a third of their length.
- The `.topbar-grid` responsive padding now actually applies.

### Costs

- Per-instance values reach CSS as custom properties, which is a second mechanism to learn alongside plain classes.
- Two elements still carry inline `transform` / `opacity`, each with a comment saying why; someone tidying those away would reintroduce the bug.
- Total CSS grew (86.6 kB → 105.3 kB) as the strings moved into stylesheets, while the JS bundle shrank (498 kB → 485 kB). Gzipped, the two roughly cancel.

## Enforced in

- `src/shared/layout/topbar.css`, `src/shared/layout/app-shell.css`
- `src/features/catalog/catalog.css`, `src/features/checkout/checkout.css`
- `src/features/catalog/home/home.css`, `src/shared/styles/responsive.css`
- `src/features/pc-builder/floating-build-card.css`
