import React from "react";
import { sx, type Vals } from "../sx";
import { TopBar } from "./TopBar";
import { EshopSidebar } from "./EshopSidebar";

/** Page frame: topbar over a 264px sidebar and the workspace column. */
export const AppShell: React.FC<{ v: Vals; children: React.ReactNode }> = ({ v, children }) => (
  <div style={sx("min-height:100vh;background:#fff")}>
    <TopBar v={v} />
    <div style={sx("display:grid;grid-template-columns:264px minmax(0,1fr)")}>
      <EshopSidebar v={v} />
      <main style={sx("min-width:0;display:flex;flex-direction:column;position:relative")}>
        {children}
      </main>
    </div>
  </div>
);
