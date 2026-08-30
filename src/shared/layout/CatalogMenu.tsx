import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Vals } from "../lib/types";
import { CATALOG, CAT_ICON, CAT_META, DEPTS } from "../../data/catalog/realCatalog";
import "./eshop-sidebar.css";

/** Departments the shop plans to open, shown so the catalog reads complete. */
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

const categorySlugs: Record<string, string> = {
  gpu: "graphic-cards", cpu: "processors", board: "motherboards", ram: "memory",
  cooler: "cpu-coolers", psu: "power-supplies", storage: "storage", case: "pc-cases",
  fans: "case-fans", phones: "smartphones", consoles: "consoles",
};

const departmentBase = (name?: string) =>
  name === "Phones" ? "/phones" : name === "Gaming" ? "/gaming" : "/pc-parts";

const goTo = (path: string) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

/**
 * The whole catalog behind one control, the way a large retailer does it.
 *
 * It appears either at the top of the sidebar rail (`rail`) or as a bar above
 * the page (`bar`); the menu behaviour is the same in both. The control, its
 * department list and the department flyout are three boxes that are not
 * nested, so one pointer check keeps the menu up for as long as the cursor is
 * over any of them, whatever gap it crosses on the way.
 */
export const CatalogMenu: React.FC<{ v: Vals; variant?: "rail" | "bar" }> = ({ v, variant = "rail" }) => {
  const [openDept, setOpenDept] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const flyout = useRef<HTMLElement>(null);
  const panel = useRef<HTMLElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);

  /**
   * The rail scrolls vertically, so it clips anything reaching past its edge.
   * The flyout is therefore positioned against the viewport, measured from the
   * control each time it opens.
   */
  useLayoutEffect(() => {
    if (!openDept || !holder.current) return;
    const measure = () => {
      const box = holder.current!.getBoundingClientRect();
      // Sit beside the open department list, whichever way the menu is laid out.
      const list = panel.current?.getBoundingClientRect();
      setAnchor(variant === "bar"
        ? { left: (list?.right ?? box.left + 268) + 8, top: box.bottom + 4 }
        : { left: (list?.right ?? box.right) + 8, top: box.top });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [openDept, variant]);

  const hold = () => { window.clearTimeout(timer.current); timer.current = undefined; setCatalogOpen(true); };
  const release = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { setCatalogOpen(false); setOpenDept(null); }, 220);
  };

  useEffect(() => {
    if (!catalogOpen) return;
    const track = (event: PointerEvent) => {
      const target = event.target as Node;
      const over = Boolean(holder.current?.contains(target)) || Boolean(flyout.current?.contains(target));
      if (over) hold(); else release();
    };
    document.addEventListener("pointermove", track);
    return () => document.removeEventListener("pointermove", track);
  }, [catalogOpen]);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpenDept(null); setCatalogOpen(false); } };
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("keydown", escape); window.clearTimeout(timer.current); };
  }, []);

  const activeDept = v.depts.find((dept: Vals) => dept.name === openDept);
  const catalogDept = DEPTS.find(dept => dept.name === activeDept?.name);
  const brands = catalogDept ? Array.from(new Set(
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

  const close = () => { setOpenDept(null); setCatalogOpen(false); };

  return (
    <div className={`eshop-catalog eshop-catalog--${variant}`} ref={holder} onMouseEnter={hold} onFocus={hold}>
      <button type="button" className="eshop-catalog-toggle" aria-expanded={catalogOpen}>
        <span className="ms">menu</span><span>Show catalog</span><span className="ms">{catalogOpen ? "expand_less" : "expand_more"}</span>
      </button>

      {catalogOpen && (
        <nav ref={panel} aria-label="Shop categories" className="eshop-rail-list eshop-catalog-panel">
          {v.depts.map((dept: Vals, index: number) => (
            <button key={index} className={`eshop-rail-item ${openDept === dept.name ? "is-open" : ""}`}
              onMouseEnter={() => setOpenDept(dept.name)} onFocus={() => setOpenDept(dept.name)}
              onClick={() => { close(); dept.go(); }} aria-expanded={openDept === dept.name}>
              <span className="ms">{dept.icon}</span><span>{dept.name}</span><b>{dept.count}</b>
              <span className="ms rail-chevron">chevron_right</span>
            </button>
          ))}
          {comingSoonCategories.map(category => (
            <div key={category.name} className="eshop-placeholder-category" aria-disabled="true">
              <span className="ms">{category.icon}</span><span>{category.name}</span><small>Soon</small>
            </div>
          ))}
        </nav>
      )}

      {openDept && <div className="eshop-scrim is-passive" aria-hidden="true" />}

      {openDept && (
        <section
          ref={flyout}
          className={`eshop-flyout eshop-flyout--${variant}`}
          style={anchor ? {
            position: "fixed",
            left: anchor.left,
            top: anchor.top,
            width: `min(1080px, calc(100vw - ${Math.round(anchor.left)}px - 24px))`,
            maxHeight: `calc(100vh - ${Math.round(anchor.top)}px - 24px)`,
          } : undefined}
          aria-label={`${activeDept?.name ?? "Catalog"} menu`}
        >
          <header>
            <div><span className="eyebrow">Browse</span><h2>{activeDept?.name ?? "Catalog"}</h2></div>
            <button onClick={close} aria-label="Close menu" data-tip="Close menu" data-tip-align="end"><span className="ms">close</span></button>
          </header>
          <div className="eshop-flyout-grid">
            {groups.map(group => (
              <button key={group.title} onClick={() => {
                close();
                if (group.featured && v.startGuided) { v.startGuided(); return; }
                if (group.slot) { goTo(`${departmentBase(activeDept?.name)}/${categorySlugs[group.slot]}`); return; }
                activeDept?.go();
              }}>
                <span className="flyout-image">{group.image ? <img src={group.image} alt="" /> : <span className="ms">{group.icon}</span>}</span>
                <span>
                  <strong>{group.title}</strong>
                  <small>{group.hint}</small>
                  <em>{group.featured ? "Open builder" : "View category"} <span className="ms">arrow_forward</span></em>
                </span>
              </button>
            ))}
          </div>
          <div className="eshop-flyout-brands">
            <div className="eshop-flyout-section-head"><span className="eyebrow">Shop by brand</span></div>
            <div className="eshop-brand-grid">
              {brands.map(brand => (
                <button key={brand.name} onClick={() => { close(); goTo(`${departmentBase(activeDept?.name)}/${brand.slug}`); }}>
                  <img src={brand.logo} alt={`${brand.name} logo`} />
                  <span><strong>{brand.name}</strong><small>{brand.count} products</small></span>
                  <span className="ms">arrow_forward</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
