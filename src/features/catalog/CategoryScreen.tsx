import React from "react";
// ADR 0005: catalog route UI is owned by the catalog feature.
// docs/decisions/0005-feature-first-source-layout.md
import type { Vals } from "../../shared/lib/types";
import { RatingLine } from "../../shared/ui/Stars";
import "./catalog.css";

/** Category listing: crumb header, brand tiles, inline sorts and chips, product grid. */
export const CategoryScreen: React.FC<{ v: Vals }> = ({ v }) => v.departmentOverview ? <DepartmentOverview v={v} /> : (
  <div className="t-page category-page">
    <div className="category-head">
      <div>
        <nav aria-label="Breadcrumb" className="category-crumbs">
          {v.crumbs.map((crumb: Vals, index: number) => <React.Fragment key={crumb.label}>
            {index > 0 && <span aria-hidden="true">/</span>}
            <button type="button" onClick={crumb.go} aria-current={crumb.current ? "page" : undefined}>{crumb.label}</button>
          </React.Fragment>)}
        </nav>
        <div className="category-title">{v.catName}</div>
        <div className="category-sub">{v.catSub}</div>
      </div>
      <div className="category-head__spacer" />
    </div>

    <div className="brand-row" data-show={v.brandRowShow}>
      <div className="category-rule">
        <div className="eyebrow">{v.subcatLabel}</div>
        <div className="category-rule__line" />
      </div>
      <div className="brand-row__tiles">
        {v.subcats.map((c: Vals, i: number) => (
          <button
            type="button"
            key={i}
            className="card prod brand-tile"
            onClick={c.go}
            style={{ "--tile-bg": c.bg, "--tile-border": c.bd, "--tile-fg": c.fg } as React.CSSProperties}
          >
            <img src={c.logo} alt={`${c.name} logo`} className="brand-tile-logo" />
            <div className="brand-tile__copy">
              <div className="brand-tile__name">{c.name}</div>
              <div className="num brand-tile__count">{c.count} products</div>
            </div>
          </button>
        ))}
      </div>
    </div>

    <div className="brand-back" data-show={v.brandBackShow}>
      <button type="button" className="text-button brand-back__link" onClick={v.brandClear}><span className="ms">arrow_back</span>All brands in {v.catNameLower}</button>
    </div>

    <div className="category-rule">
      <div className="eyebrow">{v.gridLabel}</div>
      <div className="category-rule__line" />
      <div className="num category-rule__count">{v.catSub}</div>
    </div>

    <div className="category-controls">
      <div className="sort-group">
        {v.inlineSorts.map((o: Vals, i: number) => (
          <button
            type="button"
            key={i}
            className="sort-group__option"
            onClick={o.go}
            style={{ "--option-bg": o.bg, "--option-fg": o.fg, "--option-weight": o.fw, "--option-shadow": o.sh } as React.CSSProperties}
          >{o.label}</button>
        ))}
      </div>
      <div className="category-controls__divider" />
      {v.inlineChips.map((c: Vals, i: number) => (
        <button
          type="button"
          key={i}
          className="filter-chip"
          onClick={c.go}
          style={{ "--chip-bg": c.bg, "--chip-fg": c.fg, "--chip-border": c.bd, "--chip-weight": c.fw, "--chip-icon-display": c.iconShow } as React.CSSProperties}
        >
          <span className="ms">{c.icon}</span>{c.label}
        </button>
      ))}
      <div className="category-controls__spacer" />
      {v.anyFilter && (
        <button type="button" className="text-button clear-filters" onClick={v.clearFilters}>Clear filters</button>
      )}
    </div>

    <div className="catalog-grid">
      {v.gpuCards.map((g: Vals, i: number) => <ProductCard key={i} g={g} />)}
    </div>
    {v.hiddenNote && (
      <div className="card hidden-note">
        <span className="ms">visibility_off</span>
        <div className="hidden-note__copy">{v.hiddenNote}</div>
        <div className="hidden-note__spacer" />
        <button type="button" className="text-button clear-filters" onClick={v.clearFilters}>Clear filters</button>
      </div>
    )}
  </div>
);

const DepartmentOverview: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-page department-page">
    <header>
      <div className="eyebrow">Department</div>
      <h1>{v.deptName}</h1>
    </header>
    <div className="catalog-grid">
      {v.departmentCards.map((product: Vals, index: number) => <ProductCard key={`${product.name}-${index}`} g={product} />)}
    </div>
  </div>
);

/** Listing card: state badge, one sentence, up to three chips, price, add action. */
export const ProductCard: React.FC<{ g: Vals }> = ({ g }) => (
  <div
    className="card prod product-card"
    onClick={g.go}
    role="link"
    tabIndex={0}
    onKeyDown={(event) => {
      if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) {
        event.preventDefault();
        g.go();
      }
    }}
    style={{ "--card-border": g.bd, "--card-dim": g.dim } as React.CSSProperties}
  >
    <div className="product-card__frame">
      <div className="ph">{g.image ? <img className="catalog-image" src={g.image} alt={g.name} /> : <span className="ms">image</span>}</div>
      <span
        className="product-card__state"
        style={{ "--state-display": g.stateShow, "--state-bg": g.stateBg } as React.CSSProperties}
      >{g.state}</span>
    </div>
    <div className="product-card__body">
      <div className="product-card__rating">
        <RatingLine average={g.rating.average} count={g.rating.count} size={13} />
        <span className="product-card__spacer" />
        <button type="button" className="product-card__watch"
          aria-label={g.watched ? "Stop the watchdog" : "Set a watchdog"}
          data-tip={g.watched ? "Stop watching this product" : "Watch for price and stock changes"} data-tip-align="end"
          aria-pressed={g.watched}
          onClick={(event) => { event.stopPropagation(); g.watch(); }}>
          <span className="ms">{"sound_detection_dog_barking"}</span>
        </button>
      </div>
      <div className="product-card__name">{g.name}</div>
      {g.inBuild && <div className="product-card__in-build">In your build</div>}
      <div className="product-card__desc">{g.desc}</div>
      <div className="product-card__specs">
        {g.specs.map((sp: string, i: number) => (
          <span key={i} className="product-card__spec">{sp}</span>
        ))}
      </div>
      <div className="product-card__spacer" />
    </div>
    <div className="product-card__buy">
      <div
        className="product-card__price-panel"
        style={{ "--price-panel-border": g.pricePanelBorder, "--price-panel-bg": g.pricePanelBg } as React.CSSProperties}
      >
        {g.priceKind !== "standard" && (
          <div
            className="product-card__price-header"
            style={{ "--price-header-bg": g.priceHeaderBg, "--price-header-fg": g.priceHeaderFg } as React.CSSProperties}
          >{g.priceHeader}</div>
        )}
        <div className="num product-card__price" style={{ "--price-fg": g.priceFg } as React.CSSProperties}>{g.price}</div>
      </div>
      <button
        type="button"
        className="product-card__add"
        onClick={(event) => { event.stopPropagation(); g.add(); }}
        style={{ "--add-bg": g.addBg, "--add-fg": g.addFg } as React.CSSProperties}
      ><span className="ms">shopping_bag</span>{g.cta}</button>
      <div className="product-card__stock" style={{ "--stock-fg": g.stockFg } as React.CSSProperties}>{g.stock}</div>
    </div>
  </div>
);
