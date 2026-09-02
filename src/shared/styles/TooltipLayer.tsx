import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./tooltip.css";

type Placement = "top" | "bottom";
type TooltipState = {
  target: HTMLElement | null;
  text: string;
  placement: Placement;
  left: number;
  top: number;
  visible: boolean;
};

const EMPTY: TooltipState = { target: null, text: "", placement: "bottom", left: 0, top: 0, visible: false };

/** One body-level tooltip escapes scroll containers and stacking contexts. */
export function TooltipLayer() {
  const [mounted, setMounted] = useState(false);
  const [tip, setTip] = useState<TooltipState>(EMPTY);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const hide = useCallback(() => {
    window.clearTimeout(timerRef.current);
    targetRef.current = null;
    setTip(current => current.visible ? { ...current, visible: false } : current);
  }, []);

  const position = useCallback(() => {
    const target = targetRef.current;
    const layer = layerRef.current;
    if (!target || !layer || !target.isConnected) return;
    const rect = target.getBoundingClientRect();
    const margin = 8;
    const width = layer.offsetWidth;
    const height = layer.offsetHeight;
    const requested = target.dataset.tipPlace === "top" ? "top" : "bottom";
    let placement: Placement = requested;
    let top = placement === "top" ? rect.top - height - margin : rect.bottom + margin;
    if (placement === "top" && top < margin) {
      placement = "bottom";
      top = rect.bottom + margin;
    } else if (placement === "bottom" && top + height > window.innerHeight - margin) {
      placement = "top";
      top = rect.top - height - margin;
    }
    let left = target.dataset.tipAlign === "end"
      ? rect.right - width
      : rect.left + (rect.width - width) / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
    setTip(current => ({ ...current, placement, left, top }));
  }, []);

  const show = useCallback((target: HTMLElement) => {
    const text = target.dataset.tip?.trim();
    if (!text) return;
    window.clearTimeout(timerRef.current);
    targetRef.current = target;
    timerRef.current = window.setTimeout(() => {
      setTip({ target, text, placement: "bottom", left: 0, top: 0, visible: true });
    }, 220);
  }, []);

  useEffect(() => {
    setMounted(true);
    const closestTip = (event: Event) => (event.target as Element | null)?.closest?.("[data-tip]") as HTMLElement | null;
    const onOver = (event: PointerEvent) => {
      const target = closestTip(event);
      if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
      show(target);
    };
    const onOut = (event: PointerEvent) => {
      const target = closestTip(event);
      if (target && !(event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) hide();
    };
    const onFocus = (event: FocusEvent) => {
      const target = closestTip(event);
      if (target) show(target);
    };
    const onBlur = (event: FocusEvent) => {
      if (closestTip(event)) hide();
    };
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("focusout", onBlur, true);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.clearTimeout(timerRef.current);
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      document.removeEventListener("focusin", onFocus, true);
      document.removeEventListener("focusout", onBlur, true);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [hide, position, show]);

  useLayoutEffect(() => {
    if (tip.visible) position();
  }, [position, tip.visible, tip.text]);

  if (!mounted) return null;
  return createPortal(
    <div
      ref={layerRef}
      className={`tooltip-layer${tip.visible ? " is-visible" : ""}`}
      data-placement={tip.placement}
      role="tooltip"
      aria-hidden={!tip.visible}
      style={{ left: tip.left, top: tip.top }}
    >{tip.text}</div>,
    document.body,
  );
}
