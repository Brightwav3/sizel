import type React from "react";
import { CATALOG, ORDER } from "../../data/catalog";
import { money } from "../../data/metrics";
import { RigsmithApp } from "../../RigsmithApp";
import type { BuildContext } from "../buildContext";

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
  const { app, s, m, route } = context;
  const steps = RigsmithApp.BUILD_STEPS;
  const chosenParts = s.chosen.map(slot => CATALOG[slot].find(part => part.id === s.picks[slot])!);
  const spent = chosenParts.reduce((total, part) => total + part.price, 0);
  const started = s.chosen.length > 0 && s.chosen.length < steps.length;

  return {
      cornerShow: s.chosen.length > 0,
      cornerOpen: route !== "builder" ? "true" : "false",
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
      cornerRows: steps.slice(0, 3).map(slot => {
        const done = s.chosen.includes(slot);
        const part = CATALOG[slot].find(item => item.id === s.picks[slot])!;
        const order = ORDER.find(item => item.slot === slot)!;
        return {
          name: done ? part.name : order.cat,
          icon: done ? "check" : "radio_button_checked",
          ic: done ? "var(--success)" : "var(--accent)",
          fg: done ? "var(--text-primary)" : "var(--accent-active)",
          price: done ? money(part.price) : "not chosen",
        };
      }),
      cornerRest: steps.slice(3)
        .map(slot => ORDER.find(item => item.slot === slot)!.cat.toLowerCase())
        .join(", "),
      cornerSpent: s.chosen.length ? money(spent) + " so far" : "Nothing chosen yet",
      cornerLeft: spent > s.budget
        ? money(spent - s.budget) + " over budget"
        : money(s.budget - spent) + " left of " + money(s.budget),
      cornerCta: started ? "Resume" : "Open",
      cornerResume: () => app.go("builder"),
  };
}
