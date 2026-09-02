import React from "react";
import type { Vals } from "../../shared/lib/types";
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
      <button
        type="button"
        className="build-card__pill"
        onPointerDown={v.cornerPress}
        data-tip="Open your build — drag to move it"
        data-tip-place="top"
        aria-label={`Your build, ${v.cornerCount} parts chosen, ${v.cornerSpentShort} so far. Open it.`}
      >
        <span className="ms" aria-hidden="true">construction</span>
        <span className="num build-card__pill-count">{v.cornerCount}</span>
        <span className="num build-card__pill-spent">{v.cornerSpentShort}</span>
        <span
          className="build-card__pill-bar"
          aria-hidden="true"
          style={{ "--corner-progress": v.cornerProgress } as React.CSSProperties}
        />
      </button>
    )}
    {v.cornerExpanded && (
      <div className="card build-card__panel">
        <div className="build-card__head" onPointerDown={v.cornerDrag}>
          <span className="ms build-card__grip" data-tip="Drag to move this card">drag_indicator</span>
          <div className="build-card__title">{v.cornerTitle}</div>
          <div className="num build-card__count">{v.cornerCount}</div>
          <button type="button" className="ms build-card__head-action" onPointerDown={(event) => event.stopPropagation()} onClick={v.cornerResume} data-tip="Browse the next slot" aria-label="Browse the next slot">arrow_forward</button>
          <button type="button" className="ms build-card__head-action" onPointerDown={(event) => event.stopPropagation()} onClick={v.cornerToggle} data-tip="Collapse to a bubble" data-tip-align="end" aria-label="Collapse to a bubble">remove</button>
        </div>
        <div className="build-card__rows">
          {v.cornerRows.map((c: Vals, i: number) => (
            <button type="button" key={i} className="build-card__row" onClick={c.open} aria-label={`Open ${c.slotLabel} category`} style={{ "--row-fg": c.fg, "--row-icon": c.ic } as React.CSSProperties}>
              <span className="ms">{c.icon}</span>
              <span className="build-card__row-copy"><small>{c.slotLabel}</small><strong className="build-card__row-name">{c.name}</strong></span>
              <span className="num build-card__row-price">{c.price}</span>
            </button>
          ))}
          <div className="build-card__rest">{v.cornerRest}</div>
        </div>
        <div className="build-card__foot">
          <div className="build-card__totals">
            <div className="num build-card__spent">{v.cornerSpent}</div>
            <div className="num build-card__left">{v.cornerLeft}</div>
          </div>
          <button type="button" className="pill dark build-card__cta" onClick={v.cornerResume}>{v.cornerCta}</button>
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
