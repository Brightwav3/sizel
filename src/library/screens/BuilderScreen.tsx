import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Vals } from "../sx";
import "../configurator.css";
import "../configurator-layout.css";

// ADR 0002: every build surface reads and mutates the AppState-owned build.
// docs/decisions/0002-single-build-state-and-domain-view-models.md
/**
 * Two columns, not three: the build sheet in the shell's sidebar is both the
 * navigation and the summary, the catalog fills the rest, and the totals live
 * in a bar pinned to the bottom.
 */
export function BuilderScreen({ v }: { v: Vals }) {
  const [sidebarHost, setSidebarHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSidebarHost(document.getElementById("forge-sidebar-host"));
  }, []);

  const buildSheet = (
    <nav className="forge-sheet" aria-label="Your build">
      <div className="forge-sheet__head">
        <span>Your build</span>
        <small>{v.builderSelectedCount}/9</small>
      </div>
      {v.builderRows.map((item: Vals) => (
        <button key={item.slot} className={`forge-sheet__row is-${item.state}`} onClick={item.open} aria-current={item.state === "active"}>
          <span className="forge-sheet__step">{item.state === "done" ? <span className="material-symbols-outlined">check</span> : item.step}</span>
          <span className="forge-sheet__copy">
            <small>{item.cat}</small>
            <strong>{item.name}</strong>
          </span>
          <b>{item.price}</b>
        </button>
      ))}
      {v.builderSelectedCount > 0 && (
        <button type="button" className="forge-sheet__reset" onClick={v.resetBuild}>Start over</button>
      )}
    </nav>
  );

  return (
    <section className="forge-builder">
      {sidebarHost && createPortal(buildSheet, sidebarHost)}

      <div className="forge-workspace">
        <header className="forge-catalog-head">
          <div>
            <h2>{v.builderCategory}</h2>
            <p>{v.builderOptionCount}{v.builderFacetsActive ? " · filtered" : ""}</p>
          </div>
          <label>
            <span className="material-symbols-outlined">search</span>
            <input value={v.builderSearch} onChange={v.setBuilderSearch} placeholder={`Search ${v.builderCategory.toLowerCase()}`} />
          </label>
        </header>

        <div className="forge-filters">
          <button type="button" className={`forge-fitswitch ${v.builderCompatibleOnly ? "is-on" : ""}`} onClick={v.toggleCompatibleOnly} aria-pressed={v.builderCompatibleOnly}>
            <span className={`forge-switch ${v.builderCompatibleOnly ? "is-on" : ""}`}><i /></span>
            Only what fits
            <small>{v.builderCompatibleCount}</small>
          </button>
          {v.builderFacets.map((facet: Vals) => (
            <FacetMenu key={facet.id} facet={facet} />
          ))}
          {v.builderFacetsActive && <button type="button" className="forge-clearfacets" onClick={v.clearBuilderFacets}>Clear filters</button>}
        </div>

        <div className="forge-products">
          {v.builderOptions.map((part: Vals) => <ProductRow key={part.id} part={part} />)}
          {!v.builderOptions.length && (
            <div className="forge-empty">
              <span className="material-symbols-outlined">search_off</span>
              <strong>Nothing matches</strong>
              <p>{v.builderCompatibleOnly ? "Try turning off “Only what fits”, or change a part already chosen." : "Try a different name or clear the filters."}</p>
              <button className="forge-secondary" onClick={v.clearBuilderSearch}>Clear search</button>
            </div>
          )}
        </div>
      </div>

      <footer className="forge-bar">
        <div className="forge-bar__figure">
          <small>Total</small>
          <strong className="num">{v.builderTotalLabel}</strong>
        </div>
        <div className="forge-bar__figure">
          <small>Power draw</small>
          <strong>{v.builderDraw} W{v.builderHeadroom !== null && ` · ${v.builderHeadroom} W spare`}</strong>
        </div>
        <div className={`forge-bar__status ${v.builderIssues.length ? "is-danger-badge" : v.builderComplete ? "is-success-badge" : ""}`}>
          <span className="material-symbols-outlined">{v.builderIssues.length ? "error" : v.builderComplete ? "check_circle" : "checklist"}</span>
          {v.builderIssues.length ? v.builderIssues[0] : v.builderComplete ? "Everything fits" : v.builderStatusLabel}
        </div>
        <div className="forge-bar__actions">
          {v.addBuildReason && <small>{v.addBuildReason}</small>}
          <button className="forge-primary" disabled={v.addBuildDisabled} onClick={v.addBuildToCart}>{v.addBuildLabel}</button>
        </div>
      </footer>
    </section>
  );
}

/** A facet drops down over the list rather than taking a column of its own. */
function FacetMenu({ facet }: { facet: Vals }) {
  const [open, setOpen] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const active = facet.options.filter((option: Vals) => option.mark).length;

  // The menu opens on click, so it closes on a click elsewhere or on Escape —
  // never on mouse-out, which would shut it before a choice could be made.
  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (!holder.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", away); window.removeEventListener("keydown", escape); };
  }, [open]);

  return (
    <div className="forge-facet" ref={holder}>
      <button type="button" className={active ? "is-on" : ""} onClick={() => setOpen(value => !value)} aria-expanded={open}>
        {facet.label}{active > 0 && ` (${active})`}
        <span className="material-symbols-outlined">expand_more</span>
      </button>
      {open && (
        <div className="forge-facet__menu">
          {facet.options.map((option: Vals) => (
            <button key={option.label} type="button" onClick={option.go}>
              <span className={`forge-tick ${option.mark ? "is-on" : ""}`}>{option.mark && <span className="material-symbols-outlined">check</span>}</span>
              <span>{option.label}</span>
              <small>({option.count})</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({ part }: { part: Vals }) {
  return (
    <article className={`forge-product ${part.installed ? "is-installed" : ""} ${part.incompatible ? "is-incompatible" : ""} ${part.unavailable ? "is-unavailable" : ""}`}>
      <button type="button" className="forge-product-image" onClick={part.open} aria-label={`Open ${part.name}`}>
        <img src={part.image} alt="" />
      </button>
      <div className="forge-product-copy">
        <span>{part.brand}</span>
        <h3><button type="button" className="forge-product-link" onClick={part.open}>{part.name}</button></h3>
        <p>{part.specs} · {part.stock}</p>
        {part.incompatible && (
          <p className="forge-product-clash"><span className="material-symbols-outlined">error</span>{part.incompatibleReason}</p>
        )}
      </div>
      <div className={`forge-product-price is-${part.priceKind}`}>
        {part.priceKind !== "standard" && <span>{part.priceKind === "sale" ? "Price bomb" : "New"}</span>}
        <strong>{part.price}</strong>
      </div>
      <button className="forge-select" disabled={part.disabled} onClick={part.select}>{part.actionLabel}</button>
    </article>
  );
}
