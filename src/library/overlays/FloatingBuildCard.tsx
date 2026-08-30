import React from "react";
import { sx, type Vals } from "../sx";

/** Draggable build summary that follows you around the shop. */
export const FloatingBuildCard: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-panel-slide" data-corner="1" data-open={v.cornerOpen} style={sx(`position:fixed;left:0;top:0;transform:${v.cornerTransform};z-index:25`)}>
    {v.cornerCollapsed && (
      <div onPointerDown={v.cornerDrag} onDoubleClick={v.cornerToggle} style={sx("width:52px;height:52px;border-radius:99px;background:var(--gray-900);color:#fff;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 8px 24px rgba(41,41,41,.22);cursor:grab")}>
        <span className="ms" style={sx("font-size:20px")}>construction</span>
        <span className="num" onClick={v.cornerToggle} style={sx("position:absolute;top:-2px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:99px;background:#fff;color:var(--gray-900);border:1px solid var(--border-default);font-size:12px;font-weight:500;display:flex;align-items:center;justify-content:center;cursor:pointer")}>{v.cornerCount}</span>
      </div>
    )}
    {v.cornerExpanded && (
      <div className="card" style={sx("width:296px;border-color:var(--border-default);box-shadow:0 8px 24px rgba(41,41,41,.12);overflow:hidden")}>
        <div onPointerDown={v.cornerDrag} style={sx("padding:12px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border-subtle);cursor:grab;user-select:none")}>
          <span className="ms" style={sx("font-size:14px;color:var(--gray-400)")}>drag_indicator</span>
          <div style={sx("font-size:13px;font-weight:500;flex:1")}>{v.cornerTitle}</div>
          <div className="num" style={sx("font-size:12px;color:var(--text-tertiary)")}>{v.cornerCount}</div>
          <span className="ms" onClick={v.cornerResume} style={sx("font-size:14px;color:var(--text-tertiary);cursor:pointer")}>open_in_full</span>
          <span className="ms" onClick={v.cornerToggle} style={sx("font-size:14px;color:var(--text-tertiary);cursor:pointer")}>remove</span>
        </div>
        <div style={sx("padding:10px 14px;display:flex;flex-direction:column;gap:7px")}>
          {v.cornerRows.map((c: Vals, i: number) => (
            <div key={i} style={sx(`display:flex;align-items:center;gap:8px;font-size:13px;color:${c.fg}`)}>
              <span className="ms" style={sx(`font-size:14px;color:${c.ic}`)}>{c.icon}</span>
              <span style={sx("flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{c.name}</span>
              <span className="num" style={sx("font-size:12px;color:var(--text-secondary)")}>{c.price}</span>
            </div>
          ))}
          <div style={sx("font-size:12px;color:var(--text-tertiary);padding-left:22px")}>{v.cornerRest}</div>
        </div>
        <div style={sx("padding:10px 14px 12px;border-top:1px solid var(--border-subtle);display:flex;align-items:center;gap:8px")}>
          <div style={sx("flex:1")}>
            <div className="num" style={sx("font-size:13px;font-weight:500")}>{v.cornerSpent}</div>
            <div className="num" style={sx("font-size:12px;color:var(--text-secondary)")}>{v.cornerLeft}</div>
          </div>
          <div className="pill dark" onClick={v.cornerResume} style={sx("height:28px;font-size:12px;padding:0 12px")}>{v.cornerCta}</div>
        </div>
      </div>
    )}
  </div>
);

/** Centred pill toast; opacity is the only thing that changes. */
export const Toast: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-toast is-open" style={sx(`position:fixed;bottom:24px;left:50%;margin-left:-132px;width:264px;justify-content:center;background:var(--gray-900);color:#fff;padding:11px 18px;border-radius:99px;font-size:13px;font-weight:500;box-shadow:0 8px 24px rgba(41,41,41,.24);z-index:20;display:flex;opacity:${v.toastOpacity};pointer-events:none`)}>{v.toastText}</div>
);
