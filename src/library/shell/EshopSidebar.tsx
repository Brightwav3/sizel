import React, { useEffect, useState } from "react";
import { sx, type Vals } from "../sx";
import { FilterPanel } from "./EshopFilters";
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
  const activeDept = v.depts.find((dept: Vals) => dept.name === openDept);
  const catalogDept = DEPTS.find(dept => dept.name === activeDept?.name);
  const groups: { title: string; hint: string; icon: string; image?: string; slot?: string; featured?: boolean }[] = activeDept ? [
    ...(activeDept.name === "PC parts" ? [{ title: "Build a PC", hint: "Start a build · Check compatibility · Saved builds", icon: "construction", image: "/catalog/promos/rigsmith-configurator-promo.png", featured: true }] : []),
    ...(catalogDept?.cats.map(slot => ({ title: CAT_META[slot].name, hint: `${CAT_META[slot].count} products`, icon: CAT_ICON[slot], image: CATALOG[slot][0]?.imagePath, slot })) ?? []),
  ] : [];
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenDept(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  if (v.isBuilder) {
    return <aside className="eshop-rail eshop-rail--builder" style={sx("position:sticky;top:56px;height:calc(100vh - 56px);background:var(--surface-sunken)")}><div id="forge-sidebar-host" className="forge-sidebar-host" /></aside>;
  }

  return (
    <aside className="eshop-rail" onMouseLeave={() => setOpenDept(null)} style={sx("position:sticky;top:56px;height:calc(100vh - 56px);background:var(--surface-card)")}>
      <div className="eshop-rail-scroll">
        <div className="eshop-category-rail">
          <nav aria-label="Shop categories" className="eshop-rail-list">
            {v.depts.map((dept: Vals, index: number) => {
              const open = openDept === dept.name;
              return <button key={index} className={`eshop-rail-item ${open ? "is-open" : ""}`} onMouseEnter={() => setOpenDept(dept.name)} onFocus={() => setOpenDept(dept.name)} onClick={() => { setOpenDept(null); dept.go(); }} aria-expanded={open}>
                <span className="ms">{dept.icon}</span><span>{dept.name}</span><b>{dept.count}</b><span className="ms rail-chevron">chevron_right</span>
              </button>;
            })}
            {comingSoonCategories.map(category => <div key={category.name} className="eshop-placeholder-category" aria-disabled="true"><span className="ms">{category.icon}</span><span>{category.name}</span><small>Soon</small></div>)}
          </nav>
          {v.isHome && <div className="eshop-audience-services" aria-label="Upcoming Rigsmith services">
            <div className="eshop-audience-service" aria-disabled="true"><span className="audience-icon is-student"><span className="ms">school</span></span><span><strong>Rigsmith for students</strong><small>Student pricing and study-ready tech</small></span><em>Soon</em></div>
            <div className="eshop-audience-service" aria-disabled="true"><span className="audience-icon is-business"><span className="ms">business</span></span><span><strong>Rigsmith for firms</strong><small>Bulk orders and company hardware</small></span><em>Soon</em></div>
          </div>}
        </div>
        {(v.isCategory || v.isProduct) && !v.departmentOverview && <div className="eshop-filter-wrap"><FilterPanel v={v} /></div>}
      </div>
      {openDept && <div className="eshop-scrim" onMouseDown={() => setOpenDept(null)} aria-hidden="true" />}
      {openDept && <section className="eshop-flyout" aria-label={`${activeDept?.name ?? "Catalog"} menu`}>
        <header><div><span className="eyebrow">Browse</span><h2>{activeDept?.name ?? "Catalog"}</h2></div><button onClick={() => setOpenDept(null)} aria-label="Close menu"><span className="ms">close</span></button></header>
        <div className="eshop-flyout-grid">{groups.map(group => <button key={group.title} onClick={() => { setOpenDept(null); if (group.featured && v.startGuided) { v.startGuided(); return; } if (group.slot) { const base = activeDept?.name === "Phones" ? "/phones" : activeDept?.name === "Gaming" ? "/gaming" : "/pc-parts"; const slug = ({ gpu: "graphic-cards", cpu: "processors", board: "motherboards", ram: "memory", cooler: "cpu-coolers", psu: "power-supplies", storage: "storage", case: "pc-cases", fans: "case-fans", phones: "smartphones", consoles: "consoles" } as Record<string, string>)[group.slot]; window.history.pushState({}, "", `${base}/${slug}`); window.dispatchEvent(new PopStateEvent("popstate")); return; } activeDept?.go(); }}><span className="flyout-image">{group.image ? <img src={group.image} alt="" /> : <span className="ms">{group.icon}</span>}</span><span><strong>{group.title}</strong><small>{group.hint}</small><em>{group.featured ? "Open builder" : "View category"} <span className="ms">arrow_forward</span></em></span></button>)}</div>
        <footer><span>Rigsmith catalog</span><span>{activeDept?.count ?? 0} products in this department</span></footer>
      </section>}
    </aside>
  );
};
