import React, { useEffect, useRef, useState } from "react";
import type { Vals } from "../sx";
import { FilterPanel } from "./EshopFilters";
import { CatalogMenu } from "./CatalogMenu";
import { CATALOG, CAT_ICON, CAT_META, DEPTS } from "../data/realCatalog";
import "./eshop-sidebar.css";

const groupCopy: Record<string, { title: string; hint: string }[]> = {
  "PC parts": [
    { title: "Components", hint: "Graphics cards · Processors · Memory · Storage" },
    { title: "Build a PC", hint: "Start a build · Check compatibility · Saved builds" },
    { title: "Monitors", hint: "Gaming · Professional · Office" },
    { title: "Accessories", hint: "Keyboards · Mice · Headsets" },
  ],
  Phones: [
    { title: "Phones", hint: "New arrivals · Android · iOS" },
    { title: "Phone accessories", hint: "Cases · Chargers · Cables" },
    { title: "Wearables", hint: "Smart watches · Bands · Trackers" },
  ],
  Gaming: [
    { title: "Consoles", hint: "Current generation · Handhelds · Bundles" },
    { title: "Games", hint: "New releases · PC · Console" },
    { title: "Gaming gear", hint: "Controllers · Chairs · Streaming" },
  ],
};

const comingSoonCategories = [
  { name: "Computers and accessories", icon: "laptop" },
  { name: "TV, photo and audio", icon: "tv" },
  { name: "Smart home and networking", icon: "home_iot_device" },
  { name: "Home and kitchen appliances", icon: "countertops" },
  { name: "Cameras and drones", icon: "photo_camera" },
  { name: "Toys and family", icon: "toys" },
  { name: "Garden, sport and outdoors", icon: "yard" },
  { name: "Pet supplies", icon: "pets" },
  { name: "Auto and moto", icon: "directions_car" },
  { name: "Office and stationery", icon: "business_center" },
];

export const EshopSidebar: React.FC<{ v: Vals }> = ({ v }) => {
  const [openDept, setOpenDept] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogHolder = useRef<HTMLDivElement>(null);
  const catalogTimer = useRef<number | undefined>(undefined);
  const holdCatalog = () => { window.clearTimeout(catalogTimer.current); catalogTimer.current = undefined; setCatalogOpen(true); };
  const releaseCatalog = () => {
    window.clearTimeout(catalogTimer.current);
    catalogTimer.current = window.setTimeout(() => { setCatalogOpen(false); setOpenDept(null); }, 220);
  };

  const activeDept = v.depts.find((dept: Vals) => dept.name === openDept);
  const catalogDept = DEPTS.find(dept => dept.name === activeDept?.name);
  const departmentBrands = catalogDept ? Array.from(new Set(
    catalogDept.cats.flatMap(slot => CATALOG[slot]).map(part => part.brand).filter((brand): brand is string => Boolean(brand)),
  )).map(brand => ({
    name: brand,
    slug: brand.toLowerCase().replace(/\s+/g, "-"),
    logo: `/catalog/logos/${brand.toLowerCase().replace(/\s+/g, "-")}.png`,
    count: catalogDept.cats.flatMap(slot => CATALOG[slot]).filter(part => part.brand === brand).length,
  })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)) : [];
  const groups: { title: string; hint: string; icon: string; image?: string; slot?: string; featured?: boolean }[] = activeDept ? [
    ...(activeDept.name === "PC parts" ? [{ title: "Build a PC", hint: "Start a build · Check compatibility · Saved builds", icon: "construction", image: "/catalog/promos/rigsmith-configurator-promo.png", featured: true }] : []),
    ...(catalogDept?.cats.map(slot => ({ title: CAT_META[slot].name, hint: `${CAT_META[slot].count} products`, icon: CAT_ICON[slot], image: CATALOG[slot][0]?.imagePath, slot })) ?? []),
  ] : [];
  /**
   * The menu spans three boxes that are not nested: the toggle, its dropdown,
   * and the department flyout. Rather than wiring enter/leave to each, one
   * pointer check asks "is the cursor over any of them" — so the menu stays up
   * for as long as it is, whatever gap the pointer crosses on the way.
   */
  useEffect(() => {
    if (!catalogOpen) return;
    const track = (event: PointerEvent) => {
      const target = event.target as Node;
      const over = Boolean(catalogHolder.current?.contains(target))
        || Boolean(document.querySelector(".eshop-flyout")?.contains(target));
      if (over) holdCatalog(); else releaseCatalog();
    };
    document.addEventListener("pointermove", track);
    return () => document.removeEventListener("pointermove", track);
  }, [catalogOpen]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpenDept(null); setCatalogOpen(false); } };
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("keydown", close); window.clearTimeout(catalogTimer.current); };
  }, []);

  if (v.isBuilder) {
    return <aside className="eshop-rail eshop-rail--builder"><div id="forge-sidebar-host" className="forge-sidebar-host" /></aside>;
  }

  const browsing = Boolean(v.isCategory || v.isProduct);
  const departmentItems = (
    <>
      {v.depts.map((dept: Vals, index: number) => {
        const open = openDept === dept.name;
        return <button key={index} className={`eshop-rail-item ${open ? "is-open" : ""}`} onMouseEnter={() => setOpenDept(dept.name)} onFocus={() => setOpenDept(dept.name)} onClick={() => { setOpenDept(null); setCatalogOpen(false); dept.go(); }} aria-expanded={open}>
          <span className="ms">{dept.icon}</span><span>{dept.name}</span><b>{dept.count}</b><span className="ms rail-chevron">chevron_right</span>
        </button>;
      })}
      {comingSoonCategories.map(category => <div key={category.name} className="eshop-placeholder-category" aria-disabled="true"><span className="ms">{category.icon}</span><span>{category.name}</span><small>Soon</small></div>)}
    </>
  );

  return (
    <aside className="eshop-rail" onMouseLeave={() => setOpenDept(null)}>
      <div className="eshop-rail-scroll">
        <div className="eshop-category-rail">
          {browsing ? (
            // On a listing page the rail belongs to the filters, so the
            // departments fold into the shared catalog control.
            <CatalogMenu v={v} variant="rail" />
          ) : (
            <nav aria-label="Shop categories" className="eshop-rail-list">{departmentItems}</nav>
          )}
          {v.isHome && <div className="eshop-audience-services" aria-label="Upcoming Rigsmith services">
            <div className="eshop-audience-service" aria-disabled="true"><span className="audience-icon is-student"><span className="ms">school</span></span><span><strong>Rigsmith for students</strong><small>Student pricing and study-ready tech</small></span><em>Soon</em></div>
            <div className="eshop-audience-service" aria-disabled="true"><span className="audience-icon is-business"><span className="ms">business</span></span><span><strong>Rigsmith for firms</strong><small>Bulk orders and company hardware</small></span><em>Soon</em></div>
          </div>}
        </div>
        {(v.isCategory || v.isProduct) && (
          <div className={`eshop-filter-wrap ${filtersOpen ? "is-open" : ""}`}>
            <button type="button" className="eshop-filter-toggle" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen}>
              <span className="ms">tune</span><span>Filter results</span><span className="ms">{filtersOpen ? "expand_less" : "expand_more"}</span>
            </button>
            <div className="eshop-filter-body"><FilterPanel v={v} /></div>
          </div>
        )}
      </div>
      {/* Dims the page so the open menu reads clearly. In catalog-popover mode
          it must not take the pointer, or crossing it would close the menu;
          there the hover-out delay on the catalog does the closing instead. */}
      {openDept && <div className={`eshop-scrim ${browsing ? "is-passive" : ""}`} onMouseEnter={browsing ? undefined : () => setOpenDept(null)} onMouseDown={browsing ? undefined : () => setOpenDept(null)} aria-hidden="true" />}
      {openDept && <section className="eshop-flyout" aria-label={`${activeDept?.name ?? "Catalog"} menu`}>
        <header><div><span className="eyebrow">Browse</span><h2>{activeDept?.name ?? "Catalog"}</h2></div><button onClick={() => setOpenDept(null)} aria-label="Close menu"><span className="ms">close</span></button></header>
        <div className="eshop-flyout-grid">{groups.map(group => <button key={group.title} onClick={() => { setOpenDept(null); if (group.featured && v.startGuided) { v.startGuided(); return; } if (group.slot) { const base = activeDept?.name === "Phones" ? "/phones" : activeDept?.name === "Gaming" ? "/gaming" : "/pc-parts"; const slug = ({ gpu: "graphic-cards", cpu: "processors", board: "motherboards", ram: "memory", cooler: "cpu-coolers", psu: "power-supplies", storage: "storage", case: "pc-cases", fans: "case-fans", phones: "smartphones", consoles: "consoles" } as Record<string, string>)[group.slot]; window.history.pushState({}, "", `${base}/${slug}`); window.dispatchEvent(new PopStateEvent("popstate")); return; } activeDept?.go(); }}><span className="flyout-image">{group.image ? <img src={group.image} alt="" /> : <span className="ms">{group.icon}</span>}</span><span><strong>{group.title}</strong><small>{group.hint}</small><em>{group.featured ? "Open builder" : "View category"} <span className="ms">arrow_forward</span></em></span></button>)}</div>
        <div className="eshop-flyout-brands">
          <div className="eshop-flyout-section-head"><span className="eyebrow">Shop by brand</span></div>
          <div className="eshop-brand-grid">{departmentBrands.map(brand => <button key={brand.name} onClick={() => { const base = activeDept?.name === "Phones" ? "/phones" : activeDept?.name === "Gaming" ? "/gaming" : "/pc-parts"; setOpenDept(null); window.history.pushState({}, "", `${base}/${brand.slug}`); window.dispatchEvent(new PopStateEvent("popstate")); }}><img src={brand.logo} alt={`${brand.name} logo`} /><span><strong>{brand.name}</strong><small>{brand.count} products</small></span><span className="ms">arrow_forward</span></button>)}</div>
        </div>
      </section>}
    </aside>
  );
};
