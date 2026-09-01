import React, { useEffect, useId, useRef, useState } from "react";
import { GPU_GAME_BENCHMARKS } from "../../data/benchmarks/gpuGames";
import { GAME_PROTOCOLS } from "../../data/benchmarks/gameProtocol";
import { GPU_GAME_PROVENANCE } from "../../data/benchmarks/gpuGameCalibration";
import type { BenchmarkResolution, SimulatedGame } from "../../data/benchmarks/types";
import "./game-performance.css";

const games: { id: SimulatedGame; name: string }[] = [
  { id: "fortnite", name: "Fortnite" },
  { id: "counter-strike-2", name: "Counter-Strike 2" },
  { id: "cyberpunk-2077", name: "Cyberpunk 2077" },
];
const resolutions: { value: BenchmarkResolution; label: string; dimensions: string }[] = [
  { value: "1080p", label: "Full HD", dimensions: "1920 × 1080" },
  { value: "1440p", label: "WQHD", dimensions: "2560 × 1440" },
  { value: "4K", label: "4K", dimensions: "3840 × 2160" },
];

export function GamePerformanceRail({ productId, kind }: { productId: string; kind: "gpu" }) {
  const [resolution, setResolution] = useState<BenchmarkResolution>("1080p");
  const [selected, setSelected] = useState<SimulatedGame>("fortnite");
  const [edges, setEdges] = useState({ start: true, end: true });
  const rail = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const game = games.find(item => item.id === selected)!;
  const sample = GPU_GAME_BENCHMARKS[productId]?.[selected]?.[resolution];
  const protocol = GAME_PROTOCOLS[selected];
  const provenance = GPU_GAME_PROVENANCE[productId]?.[selected];
  const tier = !sample ? "unknown" : sample.averageFps >= 144 ? "high" : sample.averageFps >= 60 ? "medium" : sample.averageFps >= 30 ? "low" : "unknown";

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () => {
      const next = { start: element.scrollLeft <= 1, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1 };
      setEdges(previous => previous.start === next.start && previous.end === next.end ? previous : next);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, []);

  const move = (direction: number) => {
    const element = rail.current;
    if (!element) return;
    const card = element.firstElementChild as HTMLElement | null;
    element.scrollBy({ left: direction * ((card?.offsetWidth ?? element.clientWidth) + (parseFloat(getComputedStyle(element).columnGap) || 0)), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return <section className="game-performance" aria-labelledby={`${id}-title`}>
    <header className="game-performance__header">
      <h2 id={`${id}-title`}>How well will it play?</h2>
      <button type="button" className="game-performance__help" onClick={() => dialog.current?.showModal()}>How does it work?</button>
      <span className="game-performance__badge">Simulated</span>
    </header>
    <div className="game-performance__body">
      <output className={`game-performance__score game-performance__score--${tier}`} aria-live="polite" aria-label={`${game.name}: ${sample?.averageFps ?? "unavailable"} simulated average FPS`}>
        <strong>{sample?.averageFps ?? "—"}</strong><span>FPS</span>
      </output>
      <div className="game-performance__carousel">
        {!edges.start && <button type="button" className="game-performance__arrow game-performance__arrow--previous" aria-label="Previous games" aria-controls={id} onClick={() => move(-1)}><span className="ms" aria-hidden="true">chevron_left</span></button>}
        <div className="game-performance__rail" id={id} ref={rail} role="group" aria-label="Choose a game">
          {games.map(item => <button type="button" className={`game-performance__poster ${selected === item.id ? "is-selected" : ""}`} key={item.id} aria-pressed={selected === item.id} aria-label={item.name} title={item.name} onClick={() => setSelected(item.id)}>
            <img src={item.id === "counter-strike-2" ? "/catalog/games/counter-strike-2-portrait.webp" : `/catalog/games/${item.id}${item.id === "fortnite" ? "-portrait" : ""}.jpg`} alt="" />
          </button>)}
        </div>
        {!edges.end && <button type="button" className="game-performance__arrow game-performance__arrow--next" aria-label="Next games" aria-controls={id} onClick={() => move(1)}><span className="ms" aria-hidden="true">chevron_right</span></button>}
      </div>
    </div>
    {kind === "gpu" && <div className="game-performance__resolutions" role="group" aria-label="Benchmark resolution">
      {resolutions.map(item => <button type="button" key={item.value} aria-pressed={resolution === item.value} onClick={() => setResolution(item.value)}><strong>{item.label}</strong> <span>{item.dimensions}</span></button>)}
    </div>}
    <dialog ref={dialog} className="game-performance__dialog" aria-labelledby={`${id}-help`} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="game-performance__dialog-content">
        <button type="button" className="game-performance__close" aria-label="Close benchmark explanation" onClick={() => dialog.current?.close()}><span className="ms" aria-hidden="true">close</span></button>
        <h2 id={`${id}-help`}>How do these benchmarks work?</h2>
        <p>Sizel uses fictional products and hand-authored game fixtures. The GPU average is calibrated to an external measured real-GPU reference; the displayed result is still derived and fictional, not a test of this rig or a prediction for the real game.</p>
        <p>Choose a game to see its average FPS. GPU results change with resolution. A complete build uses the lower of its authored CPU limit and this calibrated GPU demo value; 1% lows remain synthetic.</p>
        <dl className="game-performance__tiers">
          <div><dt><i className="game-performance__dot game-performance__score--high" />144 FPS and above</dt><dd>Highest demo performance tier.</dd></div>
          <div><dt><i className="game-performance__dot game-performance__score--medium" />60–143 FPS</dt><dd>Mid-range demo performance tier.</dd></div>
          <div><dt><i className="game-performance__dot game-performance__score--low" />30–59 FPS</dt><dd>Lower demo performance tier.</dd></div>
          <div><dt><i className="game-performance__dot game-performance__score--unknown" />Below 30 FPS</dt><dd>Lowest demo performance tier.</dd></div>
        </dl>
        <p><strong>{game.name} protocol:</strong> {protocol.preset}. {provenance ? <><a href={provenance.sourceUrl} target="_blank" rel="noreferrer">{provenance.referenceGpu} reference</a>; method: {provenance.method}. {provenance.note}</> : <><a href={protocol.sourceUrl} target="_blank" rel="noreferrer">{protocol.sourceLabel}</a> is the external reference. {protocol.note}</>}</p>
      </div>
    </dialog>
  </section>;
}
