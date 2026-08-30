import React from "react";
import type { Vals } from "../types";
import "./floating-build-card.css";

/** Draggable build summary that follows you around the shop. */
export const FloatingBuildCard: React.FC<{ v: Vals }> = ({ v }) => (
  <div
    className="t-panel-slide build-card"
    data-corner="1"
    data-open={v.cornerOpen}
    /* Drag position must stay inline: `.t-panel-slide[data-open]` also sets
       transform and would win against a class, snapping the card back. */
    style={{ transform: v.cornerTransform }}
  >
    {v.cornerCollapsed && (
      <div className="build-card__bubble" onPointerDown={v.cornerDrag} onDoubleClick={v.cornerToggle} data-tip="Your build: drag to move, double-click to open" data-tip-place="top">
        <span className="ms">construction</span>
        <span className="num build-card__bubble-count" onClick={v.cornerToggle}>{v.cornerCount}</span>
      </div>
    )}
    {v.cornerExpanded && (
      <div className="card build-card__panel">
        <div className="build-card__head" onPointerDown={v.cornerDrag}>
          <span className="ms build-card__grip" data-tip="Drag to move this card">drag_indicator</span>
          <div className="build-card__title">{v.cornerTitle}</div>
          <div className="num build-card__count">{v.cornerCount}</div>
          <span className="ms build-card__head-action" onClick={v.cornerResume} data-tip="Open the full build">open_in_full</span>
          <span className="ms build-card__head-action" onClick={v.cornerToggle} data-tip="Collapse to a bubble" data-tip-align="end">remove</span>
        </div>
        <div className="build-card__rows">
          {v.cornerRows.map((c: Vals, i: number) => (
            <div key={i} className="build-card__row" style={{ "--row-fg": c.fg, "--row-icon": c.ic } as React.CSSProperties}>
              <span className="ms">{c.icon}</span>
              <span className="build-card__row-name">{c.name}</span>
              <span className="num build-card__row-price">{c.price}</span>
            </div>
          ))}
          <div className="build-card__rest">{v.cornerRest}</div>
        </div>
        <div className="build-card__foot">
          <div className="build-card__totals">
            <div className="num build-card__spent">{v.cornerSpent}</div>
            <div className="num build-card__left">{v.cornerLeft}</div>
          </div>
          <div className="pill dark build-card__cta" onClick={v.cornerResume}>{v.cornerCta}</div>
        </div>
      </div>
    )}
  </div>
);

/** Centred pill toast; opacity is the only thing that changes. */
export const Toast: React.FC<{ v: Vals }> = ({ v }) => (
  <div
    className="t-toast is-open build-toast"
    /* Inline for the same reason as the card: `.t-toast.is-open` sets opacity. */
    style={{ opacity: v.toastOpacity }}
  >{v.toastText}</div>
);
