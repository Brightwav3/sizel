# Rigsmith UI

The component library behind `Rigsmith Prototype.dc.html`. Same tokens, same
markup structure, same motion — extracted so the prototype's screens can be
rebuilt in a real React + TypeScript app without redrawing anything.

```
library/
  tokens.ts              Rigsmith colours, type ramp, radii, shadows, motion vars
  types.ts               Slot, Part, Picks, Metrics, Route
  motion.css             the four transitions.dev recipes + the icon-font class
  data/
    catalog.ts           nine categories of parts, spec + description generators
    metrics.ts           price / fps / noise / delivery + compatibility rules
  primitives/            Icon, Card, Pill, Placeholder, Toggle, SpecChip, NumberPopIn
  shell/                 AppShell, TopBar, SideItem, CatalogNav, FilterPanel
  commerce/              ProductCard, ProductGrid, CategoryHeader, ProductDetail,
                         NewsStrip, JournalCard
  build/                 ReadoutCard, BuildTable, ComparisonTable,
                         GuidedAssembler, FloatingBuildCard
  checkout/              CartLine, DeliveryCard, OrderSummary, StepFlow
  feedback/              Toast, ChangeCard, CompatibilityNote
```

## Rules the library encodes

**Shop first.** The catalog is nine ordinary product categories. Every one opens
a listing and a product page; adding a part to a build is a secondary action.
The guided assembler is a separate mode reached deliberately.

**Four type sizes.** 12 / 13 / 14 / 24, weights 400 and 500. Nothing else — a
new size means a new decision, and there aren't any left to make.

**Two radii and one chip.** 8px for nav and inputs, 16px for cards, 99px for
pills, 4px for spec chips.

**Plain language over specs.** Product cards carry one sentence about what you
get, then at most three spec chips. Build rows say why the part is there.

**Deterministic numbers.** `metrics()` is the single source for price, frame
rate, noise, delivery, and compatibility. Screens never compute their own.

**Motion is four recipes.** Page enter, panel reveal, toast, number pop-in —
from transitions.dev, tuned once in `motion.css`, with reduced-motion honoured.

## Composing a screen

```tsx
import "./library/motion.css";
import {
  AppShell, CatalogNav, FilterPanel, SideItem,
  CategoryHeader, ProductGrid, FloatingBuildCard,
  CATALOG, CAT_META, DESCS, SPECS, metrics, money,
  type FilterState, type Slot,
} from "./library";

export function CategoryScreen() {
  const [cat, setCat] = React.useState<Slot>("gpu");
  const [catalogOpen, setCatalogOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterState>({
    use: "any", maxPrice: 1100, brand: "any", sort: "popular",
    stockOnly: false, fitOnly: true,
  });
  const [picks, setPicks] = React.useState(DEFAULT_PICKS);
  const m = metrics(picks);

  const items = CATALOG[cat].filter(p => p.price <= filters.maxPrice);

  return (
    <AppShell
      savedCount={2}
      cartCount={0}
      onLogo={() => {}}
      onCart={() => {}}
      sidebar={
        <>
          <SideItem icon="home" label="Home" onClick={() => {}} />
          <CatalogNav
            active={cat}
            collapsed={!catalogOpen}
            onSelect={s => { setCat(s); setCatalogOpen(false); }}
            onExpand={() => setCatalogOpen(true)}
          />
          <FilterPanel
            open
            showUseFilter={cat === "gpu"}
            brands={[{ label: "All brands", value: "any", count: CATALOG[cat].length }]}
            value={filters}
            onChange={p => setFilters(f => ({ ...f, ...p }))}
          />
        </>
      }
    >
      <div className="t-page" style={{ padding: "32px 36px 280px", display: "flex", flexDirection: "column", gap: 20 }}>
        <CategoryHeader
          name={CAT_META[cat].name}
          shownCount={items.length}
          totalCount={CAT_META[cat].count}
          blurb={CAT_META[cat].blurb}
          onCompare={() => {}}
        />
        <ProductGrid
          items={items.map(p => ({
            id: p.id,
            name: p.name,
            brand: p.brand ?? p.name.split(" ")[0],
            description: DESCS[cat](p),
            specs: SPECS[cat](p),
            price: money(p.price),
            stock: p.days <= 2 ? "In stock" : \`Ships in \${p.days} days\`,
            stockTone: p.days <= 2 ? "neutral" : "warning",
            tag: p.tag,
            selected: picks[cat] === p.id,
            cta: picks[cat] === p.id ? "In your build" : "Add to build",
            onOpen: () => {},
            onAdd: () => setPicks(x => ({ ...x, [cat]: p.id })),
          }))}
        />
      </div>

      <FloatingBuildCard
        open
        title="Quiet 1440p"
        count="9/9"
        rows={[]}
        rest=""
        spent={money(m.price)}
        remaining="\$58 left"
        cta="Open"
        onOpen={() => {}}
      />
    </AppShell>
  );
}
```

## Not included

Product photography (every image is a `Placeholder`), real inventory, payment,
and the WebMCP tool bindings. The tool surface — `search_parts`,
`compare_parts`, `check_compatibility`, `estimate_performance`,
`optimize_build`, `save_build`, `add_build_to_cart` — maps onto
`data/catalog.ts` and `data/metrics.ts`; wire it there, not in the components.
