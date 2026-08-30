import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CATALOG, DEFAULT_PICKS, ORDER } from "../data/realCatalog";
import type { Part, PcSlot, Picks } from "../types";
import "../configurator.css";

const cash = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const getPart = (picks: Picks, slot: PcSlot) => CATALOG[slot].find(part => part.id === picks[slot]) ?? CATALOG[slot][0];

function checkBuild(picks: Picks) {
  const cpu = getPart(picks, "cpu"), gpu = getPart(picks, "gpu"), board = getPart(picks, "board"), ram = getPart(picks, "ram"), cooler = getPart(picks, "cooler"), psu = getPart(picks, "psu"), pcCase = getPart(picks, "case");
  const issues: string[] = [];
  if (cpu.socket !== board.socket) issues.push("CPU and motherboard sockets do not match");
  if (ram.memoryType !== board.memoryType) issues.push("Memory type does not match the motherboard");
  if (cpu.socket && cooler.supportedSockets?.length && !cooler.supportedSockets.includes(cpu.socket)) issues.push("Cooler does not support this CPU socket");
  if (board.formFactor && pcCase.supportedMotherboards?.length && !pcCase.supportedMotherboards.includes(board.formFactor)) issues.push("Motherboard does not fit the case");
  if (gpu.len && pcCase.clearance && gpu.len > pcCase.clearance) issues.push("Graphics card is too long for the case");
  const draw = (gpu.watt ?? 0) + (cpu.cpuPowerW ?? 65) + 80;
  if ((psu.watt ?? 0) < draw) issues.push("Power supply needs more capacity");
  return { issues, draw, headroom: Math.max(0, (psu.watt ?? 0) - draw) };
}

export function BuilderScreen({ v: _v }: { v?: unknown }) {
  const budget = 2200;
  const [picks, setPicks] = useState<Picks>({ ...DEFAULT_PICKS }), [slot, setSlot] = useState<PcSlot>("gpu"), [query, setQuery] = useState(""), [sidebarHost, setSidebarHost] = useState<HTMLElement | null>(null);
  const build = useMemo(() => ORDER.map(item => ({ ...item, part: getPart(picks, item.slot) })), [picks]);
  const total = build.reduce((sum, item) => sum + item.part.price, 0), health = checkBuild(picks), activeMeta = ORDER.find(item => item.slot === slot)!;
  const options = CATALOG[slot].filter(part => `${part.brand ?? ""} ${part.name} ${part.model ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    setSidebarHost(document.getElementById("forge-sidebar-host"));
  }, []);

  const partsNavigation = <nav className="forge-parts" aria-label="Build parts"><div className="forge-section-label"><span>Your build</span><small>9 selected</small></div>{build.map(item => <button key={item.slot} className={slot === item.slot ? "is-active" : ""} onClick={() => { setSlot(item.slot); setQuery(""); }}><span className="material-symbols-outlined">{item.icon}</span><span><strong>{item.cat}</strong><small>{item.part.name}</small></span><b>{cash(item.part.price)}</b></button>)}</nav>;

  return <section className="forge-builder">{sidebarHost && createPortal(partsNavigation, sidebarHost)}<header className="forge-toolbar"><div><span className="forge-kicker">PC builder</span><h1>Gaming build</h1></div></header><div className="forge-layout">
    <main className="forge-catalog"><div className="forge-catalog-head"><div><span className="forge-kicker">Selecting</span><h2>{activeMeta.cat}</h2><p>{options.length} catalog options</p></div><label><span className="material-symbols-outlined">search</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${activeMeta.cat.toLowerCase()}`} /></label></div><div className="forge-installed"><span>Installed</span><strong>{getPart(picks, slot).name}</strong><small>{getPart(picks, slot).specs?.slice(0, 2).join(" · ")}</small></div><div className="forge-products">{options.map(part => <ProductRow key={part.id} part={part} installed={picks[slot] === part.id} onSelect={() => setPicks(current => ({ ...current, [slot]: part.id }))} />)}{!options.length && <div className="forge-empty"><span className="material-symbols-outlined">search_off</span><strong>No matching parts</strong><p>Try a different name or clear the search.</p><button className="forge-secondary" onClick={() => setQuery("")}>Clear search</button></div>}</div></main>
    <aside className="forge-review forge-review--docked" aria-label="Build summary"><header><div><span className="forge-kicker">Build summary</span><h2>Ready for the bench</h2></div><small className={health.issues.length ? "is-danger-badge" : "is-success-badge"}>{health.issues.length ? `${health.issues.length} issues` : "All clear"}</small></header><div className="forge-review-list">{build.map(item => <button key={item.slot} onClick={() => { setSlot(item.slot); setQuery(""); }}><span className="material-symbols-outlined">{item.icon}</span><span><small>{item.cat}</small><strong>{item.part.name}</strong></span><b>{cash(item.part.price)}</b></button>)}</div><div className="forge-bench-health"><span>{health.draw} W draw</span><span>{health.headroom} W headroom</span></div><footer><div><span>{total > budget ? `${cash(total - budget)} over budget` : `${cash(budget - total)} left`}</span><strong>{cash(total)}</strong></div><button className="forge-primary" disabled={health.issues.length > 0}>Add to cart</button></footer></aside></div>
  </section>;
}

function ProductRow({ part, installed, onSelect }: { part: Part; installed: boolean; onSelect: () => void }) {
  const priceKind = part.merchandising ?? "standard";
  return <article className={`forge-product ${installed ? "is-installed" : ""}`}><div className="forge-product-image"><img src={part.imagePath} alt="" /></div><div className="forge-product-copy"><span>{part.brand}</span><h3>{part.name}</h3><p>{part.specs?.slice(0, 3).join(" · ")} · {part.stock === 0 ? "Unavailable" : `Ships in ${part.days} days`}</p></div><div className={`forge-product-price is-${priceKind}`}>{priceKind !== "standard" && <span>{priceKind === "sale" ? "Price bomb" : "New"}</span>}<strong>{cash(part.price)}</strong></div><button className="forge-select" disabled={installed || part.stock === 0} onClick={onSelect}>{installed ? "Installed" : "Select"}</button></article>;
}
