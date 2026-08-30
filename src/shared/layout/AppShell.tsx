import React from "react";
// ADR 0005: persistent application chrome belongs to shared layout.
// docs/decisions/0005-feature-first-source-layout.md
import type { Vals } from "../lib/types";
import { TopBar } from "./TopBar";
import { EshopSidebar } from "./EshopSidebar";
import { CatalogMenu } from "./CatalogMenu";
import "../styles/responsive.css";
import "./app-shell.css";

/**
 * Page frame. Listing pages keep the sidebar rail for filters; a product page
 * takes the full width and gets a catalog bar above it instead — the catalog
 * control sits next to the breadcrumb, the way large retailers lay it out.
 * Column widths reflow in responsive.css — see `.shell-grid`.
 */
export const AppShell: React.FC<{ v: Vals; children: React.ReactNode }> = ({ v, children }) => (
  <div className="app-shell">
    <TopBar v={v} />
    {v.isProduct ? (
      <>
        <div className="catalog-bar">
          <CatalogMenu v={v} variant="bar" />
          <nav aria-label="Breadcrumb" className="catalog-bar__crumbs">
            <button type="button" onClick={v.goCategory}>{v.pCatName}</button>
            <span aria-hidden="true">/</span>
            <span>{v.pName}</span>
          </nav>
        </div>
        <main className="app-shell__main">
          {children}
        </main>
      </>
    ) : (
      <div className="shell-grid">
        <EshopSidebar v={v} />
        <main className="app-shell__main">
          {children}
        </main>
      </div>
    )}
  </div>
);
