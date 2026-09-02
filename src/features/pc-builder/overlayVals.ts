import type React from "react";
import { CATALOG, ORDER } from "../../data/catalog/catalog";
import { money } from "../../entities/build/metrics";
import { RigsmithApp } from "../../app/App";
import type { BuildContext } from "../../entities/build/buildContext";

/**
 * The floating build card. It reports the build the shopper is actually
 * assembling — the slots they have chosen — rather than the progress of the
 * guided flow the app no longer has.
 *
 * It appears only once there is a build to report. The configurator is one
 * service among several, so a shopper who has not opened it should not be
 * followed around the shop by a card counting to zero; the sidebar, the home
 * hero and the product page all still lead into it.
 */
export function buildOverlayVals(context: BuildContext) {
  const { app, s } = context;
  const steps = RigsmithApp.BUILD_STEPS;
  const chosenParts = s.chosen.map(slot => CATALOG[slot].find(part => part.id === s.picks[slot])!);
  const spent = chosenParts.reduce((total, part) => total + part.price, 0);
  const started = Boolean(s.buildBrief.trim()) && s.chosen.length < steps.length;

  return {
      cornerShow: s.chosen.length > 0 || Boolean(s.buildBrief.trim()),
      cornerOpen: "true",
      cornerTransform: "translate(" + app.dockPoint().x + "px," + app.dockPoint().y + "px)",
      cornerExpanded: !s.cornerMin, cornerCollapsed: s.cornerMin,
      cornerToggle: () => app.setState({ cornerMin: !s.cornerMin }),
      cornerDrag: app.cornerDrag,
      /** Collapsed, the card is one control: press to open, drag to move. */
      cornerPress: (event: React.PointerEvent) =>
        app.cornerDrag(event, () => app.setState({ cornerMin: false })),
      /** How much of the machine is picked, as a width for the progress bar. */
      cornerProgress: Math.round((s.chosen.length / steps.length) * 100) + "%",
      cornerSpentShort: money(spent),
      cornerRemaining: `${steps.length - s.chosen.length} to go`,
      cornerTitle: started ? "Build in progress" : s.chosen.length ? "Your build" : "Start a build",
      cornerCount: `${s.chosen.length} / ${steps.length}`,
      /** Every slot is a real navigation target. The builder is intentionally
       * not the UI path for visual agents: each click opens the category where
       * the part's full product details can be compared. */
      cornerRows: steps.map(slot => {
        const done = s.chosen.includes(slot);
        const part = CATALOG[slot].find(item => item.id === s.picks[slot])!;
        const order = ORDER.find(item => item.slot === slot)!;
        return {
          slot,
          slotLabel: order.cat,
          name: done ? part.name : "Not selected",
          icon: done ? "check" : "radio_button_checked",
          ic: done ? "var(--success)" : "var(--accent)",
          fg: done ? "var(--text-primary)" : "var(--accent-active)",
          price: done ? money(part.price) : "not chosen",
          open: () => app.setState({ route: "category", dept: "pc", openDept: null, category: slot, productSlot: slot, brand: "any", search: "" }),
        };
      }),
      cornerRest: "Open a slot to compare its products and specifications.",
      cornerSpent: s.chosen.length ? money(spent) + " so far" : "Nothing chosen yet",
      cornerLeft: spent > s.budget
        ? money(spent - s.budget) + " over budget"
        : money(s.budget - spent) + " left of " + money(s.budget),
      cornerCta: "Browse next slot",
      cornerResume: () => app.setState({ route: "category", dept: "pc", openDept: null, category: steps.find(slot => !s.chosen.includes(slot)) ?? steps[0], productSlot: steps.find(slot => !s.chosen.includes(slot)) ?? steps[0], brand: "any", search: "" }),
  };
}
