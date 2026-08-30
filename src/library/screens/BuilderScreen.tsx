import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Vals } from "../sx";
import "../configurator.css";

// ADR 0002: every build surface reads and mutates the AppState-owned build.
// docs/decisions/0002-single-build-state-and-domain-view-models.md
export function BuilderScreen({ v }: { v: Vals }) {
  const [sidebarHost, setSidebarHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSidebarHost(document.getElementById("forge-sidebar-host"));
  }, []);

  const partsNavigation = (
    <nav className="forge-parts" aria-label="Build parts">
      <div className="forge-section-label"><span>Your build</span><small>9 selected</small></div>
      {v.builderRows.map((item: Vals) => (
        <button key={item.slot} className={v.builderSlot === item.slot ? "is-active" : ""} onClick={item.open}>
          <span className="material-symbols-outlined">{item.icon}</span>
          <span><strong>{item.cat}</strong><small>{item.name}</small></span>
          <b>{item.price}</b>
        </button>
      ))}
    </nav>
  );

  return (
    <section className="forge-builder">
      {sidebarHost && createPortal(partsNavigation, sidebarHost)}
      <header className="forge-toolbar"><div><span className="forge-kicker">PC builder</span><h1>Gaming build</h1></div></header>
      <div className="forge-layout">
        <main className="forge-catalog">
          <div className="forge-catalog-head">
            <div><span className="forge-kicker">Selecting</span><h2>{v.builderCategory}</h2><p>{v.builderOptions.length} catalog options</p></div>
            <label><span className="material-symbols-outlined">search</span><input value={v.builderSearch} onChange={v.setBuilderSearch} placeholder={`Search ${v.builderCategory.toLowerCase()}`} /></label>
          </div>
          <div className="forge-installed"><span>Installed</span><strong>{v.builderInstalled.name}</strong><small>{v.builderInstalled.specs}</small></div>
          <div className="forge-products">
            {v.builderOptions.map((part: Vals) => <ProductRow key={part.id} part={part} />)}
            {!v.builderOptions.length && <div className="forge-empty"><span className="material-symbols-outlined">search_off</span><strong>No matching parts</strong><p>Try a different name or clear the search.</p><button className="forge-secondary" onClick={v.clearBuilderSearch}>Clear search</button></div>}
          </div>
        </main>
        <aside className="forge-review forge-review--docked" aria-label="Build summary">
          <header><div><span className="forge-kicker">Build summary</span><h2>Ready for the bench</h2></div><small className={v.builderIssues.length ? "is-danger-badge" : "is-success-badge"}>{v.builderIssues.length ? `${v.builderIssues.length} issues` : "All clear"}</small></header>
          <div className="forge-review-list">{v.builderRows.map((item: Vals) => <button key={item.slot} onClick={item.open}><span className="material-symbols-outlined">{item.icon}</span><span><small>{item.cat}</small><strong>{item.name}</strong></span><b>{item.price}</b></button>)}</div>
          <div className="forge-bench-health"><span>{v.builderDraw} W draw</span><span>{v.builderHeadroom} W headroom</span></div>
          <footer><div><span>{v.headroomLabel}</span><strong>{v.totalLabel}</strong></div><button className="forge-primary" disabled={v.builderIssues.length > 0} onClick={v.addBuildToCart}>{v.addBuildLabel}</button></footer>
        </aside>
      </div>
    </section>
  );
}

function ProductRow({ part }: { part: Vals }) {
  return <article className={`forge-product ${part.installed ? "is-installed" : ""}`}><div className="forge-product-image"><img src={part.image} alt="" /></div><div className="forge-product-copy"><span>{part.brand}</span><h3>{part.name}</h3><p>{part.specs} · {part.stock}</p></div><div className={`forge-product-price is-${part.priceKind}`}>{part.priceKind !== "standard" && <span>{part.priceKind === "sale" ? "Price bomb" : "New"}</span>}<strong>{part.price}</strong></div><button className="forge-select" disabled={part.disabled} onClick={part.select}>{part.installed ? "Installed" : "Select"}</button></article>;
}
