import React from "react";
import { sx, type Vals } from "../sx";
import { TopBar } from "./TopBar";
import { EshopSidebar } from "./EshopSidebar";
import { CatalogMenu } from "./CatalogMenu";
import "../responsive.css";

/**
 * Page frame. Listing pages keep the sidebar rail for filters; a product page
 * takes the full width and gets a catalog bar above it instead — the catalog
 * control sits next to the breadcrumb, the way large retailers lay it out.
 * Column widths reflow in responsive.css — see `.shell-grid`.
 */
export const AppShell: React.FC<{ v: Vals; children: React.ReactNode }> = ({ v, children }) => (
  <div style={sx("min-height:100vh;background:#fff")}>
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
        <main style={sx("min-width:0;display:flex;flex-direction:column;position:relative")}>
          {children}
        </main>
      </>
    ) : (
      <div className="shell-grid">
        <EshopSidebar v={v} />
        <main style={sx("min-width:0;display:flex;flex-direction:column;position:relative")}>
          {children}
        </main>
      </div>
    )}
  </div>
);
