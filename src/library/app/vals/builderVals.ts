import React from "react";
import { CATALOG, DEFAULT_PICKS, ORDER } from "../../data/catalog";
import { compatibilityIssues, money } from "../../data/metrics";
import { FACETS } from "../catalogFacets";
import { facetSummary, facetValues } from "../../domain/queries";
import { RigsmithApp } from "../../RigsmithApp";
import type { Part, PcSlot } from "../../types";
import type { BuildContext } from "../buildContext";

export function buildBuilderVals(context: BuildContext) {
  const { app, s, m, route, on, cat, facetValues } = context;
  const builderPicks = app.chosenPicks();
  const steps = RigsmithApp.BUILD_STEPS;
  const selectedPart = (slot: PcSlot) => s.chosen.includes(slot) ? CATALOG[slot].find(part => part.id === s.picks[slot]) : undefined;
  const selectedParts = steps.flatMap(slot => { const part = selectedPart(slot); return part ? [part] : []; });
  const selectedCount = selectedParts.length;
  const builderIssues = compatibilityIssues(builderPicks);
  const builderPrice = selectedParts.reduce((total, part) => total + part.price, 0);
  const builderGpu = selectedPart("gpu"), builderCpu = selectedPart("cpu"), builderPsu = selectedPart("psu");
  const builderDraw = selectedCount ? (builderGpu?.watt ?? 0) + (builderCpu?.cpuPowerW ?? 0) + 80 : 0;
  const builderComplete = selectedCount === steps.length;
  const activeSlot = s.builderSlot;
  const nextGap = steps.find(slot => !s.chosen.includes(slot));

  /** The slot's parts before facet filtering — the pool the facet counts describe. */
  const slotSearch = s.builderSearch.trim().toLowerCase();
  const slotPool = CATALOG[activeSlot].filter(part =>
    `${part.brand ?? ""} ${part.name} ${part.model ?? ""}`.toLowerCase().includes(slotSearch));
  const reasonFor = (part: Part) => compatibilityIssues({ ...builderPicks, [activeSlot]: part.id })[0];
  const compatiblePool = slotPool.filter(part => !reasonFor(part));
  const facetPool = s.builderCompatibleOnly ? compatiblePool : slotPool;
  const shownPool = facetPool.filter(part =>
    (FACETS[activeSlot] || []).every(definition => {
      const selected = s.builderFacets[definition.id] || [];
      return selected.length === 0 || selected.some(value => facetValues(definition, part).includes(value));
    }));

  return {
      builderCategory: (ORDER.find(item => item.slot === activeSlot) || ({} as any)).cat || activeSlot,
      builderSearch: s.builderSearch,
      setBuilderSearch: (event: React.ChangeEvent<HTMLInputElement>) => app.setState({ builderSearch: event.target.value }),
      clearBuilderSearch: () => app.setState({ builderSearch: "" }),

      /** Build sheet: navigation and summary in one column. ADR 0002. */
      builderRows: steps.map((slot, index) => {
        const item = ORDER.find(entry => entry.slot === slot)!;
        const part = selectedPart(slot);
        const state = part ? "done" : slot === activeSlot ? "active" : slot === nextGap ? "next" : "todo";
        return {
          slot, icon: item.icon, cat: item.cat, step: index + 1, state,
          name: part?.name ?? (slot === nextGap ? "Choose next" : "Not selected"),
          price: part ? money(part.price) : "—",
          selected: Boolean(part),
          open: () => app.setState({ builderSlot: slot, builderSearch: "", builderFacets: {} }),
        };
      }),

      /** Compatibility is stated on the row, not buried in the stock line. */
      builderOptions: shownPool.map(part => {
        const incompatibility = reasonFor(part);
        const installed = s.chosen.includes(activeSlot) && s.picks[activeSlot] === part.id;
        const unavailable = part.stock === 0;
        return {
          id: part.id, brand: part.brand, name: part.name, image: part.imagePath,
          specs: part.specs?.slice(0, 3).join(" · "),
          stock: unavailable ? "Out of stock" : `Ships in ${part.days} days`,
          incompatibleReason: incompatibility ?? "",
          price: money(part.price), priceKind: part.merchandising ?? "standard",
          installed, incompatible: Boolean(incompatibility), unavailable,
          disabled: installed || unavailable || Boolean(incompatibility),
          actionLabel: installed ? "Selected" : incompatibility ? "Does not fit" : unavailable ? "Unavailable" : "Select",
          select: () => app.setBuilderPart(activeSlot, part.id),
          open: () => app.setState({ route: "product", productSlot: activeSlot, productId: part.id }),
        };
      }),

      /** Same facets the shop uses, scoped to the slot being filled. */
      builderFacets: facetSummary({ category: activeSlot, facets: s.builderFacets }, facetPool).map(facet => ({
        id: facet.id,
        label: facet.label,
        options: facet.options.map(option => ({
          label: option.value,
          count: String(option.count),
          mark: option.selected ? "check" : "",
          go: () => app.toggleBuilderFacet(facet.id, option.value),
        })),
      })),
      builderFacetsActive: Object.values(s.builderFacets).some(values => values.length > 0),
      clearBuilderFacets: () => app.setState({ builderFacets: {} }),
      builderCompatibleOnly: s.builderCompatibleOnly,
      builderCompatibleCount: `${compatiblePool.length} of ${slotPool.length} fit`,
      toggleCompatibleOnly: () => app.setState({ builderCompatibleOnly: !s.builderCompatibleOnly, builderFacets: {} }),
      builderOptionCount: `${shownPool.length} option${shownPool.length === 1 ? "" : "s"}`,

      builderIssues, builderDraw, builderHeadroom: builderPsu ? Math.max(0, (builderPsu.watt ?? 0) - builderDraw) : null,
      builderSelectedCount: selectedCount,
      builderComplete,
      builderTotalLabel: money(builderPrice),
      builderStatusLabel: builderIssues.length ? `${builderIssues.length} issues` : builderComplete ? "All clear" : `${selectedCount}/${ORDER.length} selected`,
      resetBuild: () => app.setState({ picks: { ...DEFAULT_PICKS }, chosen: [], builderSearch: "", lastChange: null, toast: "Build reset" }, () => app.flash()),
      /** A disabled button has to say what is missing. */
      addBuildLabel: s.cart.some(line => line.kind === "build") ? "In your cart" : "Add build to cart · " + money(builderPrice),
      addBuildDisabled: !builderComplete || builderIssues.length > 0,
      addBuildReason: builderIssues.length
        ? `${builderIssues.length} part${builderIssues.length === 1 ? "" : "s"} do not fit`
        : builderComplete ? "" : `${steps.length - selectedCount} part${steps.length - selectedCount === 1 ? "" : "s"} still missing`,
      addBuildToCart: () => app.addBuildToCart(),
      shipLabel: app.shipDate(m.days),
  };
}
