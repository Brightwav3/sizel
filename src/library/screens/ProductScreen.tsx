import React from "react";
import { sx, type Vals } from "../sx";

/** Universal product detail: the gallery stays calm while the purchase decision gets richer. */
export const ProductScreen: React.FC<{ v: Vals }> = ({ v }) => (
  <div className="t-page" style={sx("padding:var(--space-8) var(--space-8) var(--space-16);display:flex;flex-direction:column;gap:var(--space-6);max-width:1280px;width:100%;margin:0 auto")}>
    <div style={sx("display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);color:var(--text-tertiary)")}>
      <span onClick={v.goCategory} style={sx("cursor:pointer;color:var(--text-accent)")}>{v.pCatName}</span>
      <span aria-hidden="true">/</span>
      <span style={sx("overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{v.pName}</span>
    </div>

    <div style={sx("display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,0.85fr);gap:var(--space-8);align-items:start")}>
      <section style={sx("display:flex;flex-direction:column;gap:var(--space-4);min-width:0")}>
        <div className="card" style={sx("padding:var(--space-4);background:var(--surface-sunken);box-shadow:var(--shadow-card);border-color:var(--border-subtle)")}>
          <div className="ph" style={sx("height:clamp(320px,42vw,520px);background:var(--gray-0);border:1px solid var(--border-subtle);border-radius:var(--radius-nav);overflow:hidden")}>
            {v.pImage ? <img className="catalog-image" src={v.pImage} alt={v.pName} /> : <span className="ms" style={sx("font-size:var(--text-2xl)")}>image</span>}
          </div>
        </div>
        <div style={sx("display:flex;gap:var(--space-2);align-items:center")}>
          {[1, 2, 3].map(index => (
            <div key={index} className="card" style={sx("width:var(--space-16);height:var(--space-16);padding:var(--space-1);background:var(--gray-0);border-color:var(--border-default);overflow:hidden")}>
              {v.pImage ? <img className="catalog-image" src={v.pImage} alt={`${v.pName} view ${index}`} /> : <span className="ms" style={sx("font-size:var(--text-base);color:var(--text-tertiary)")}>image</span>}
            </div>
          ))}
          <span style={sx("font-size:var(--text-xs);color:var(--text-tertiary);margin-left:var(--space-2)")}>Product photography from the Rigsmith catalog</span>
        </div>

        {v.pIsGpu && (
          <div className="card" style={sx("padding:var(--space-5);display:flex;flex-direction:column;gap:var(--space-4);background:var(--surface-card)")}>
            <div style={sx("display:flex;align-items:baseline;gap:var(--space-2)")}>
              <div style={sx("font-size:var(--text-base);font-weight:var(--weight-medium)")}>Expected frame rates</div>
              <div style={sx("font-size:var(--text-xs);color:var(--text-tertiary)")}>estimated from catalog specs</div>
            </div>
            <div style={sx("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-3)")}>
              {v.pFpsCards.map((f: Vals, i: number) => (
                <div key={i} style={sx("padding:var(--space-4);background:var(--surface-sunken);border-radius:var(--radius-nav)")}>
                  <div style={sx("font-size:var(--text-xs);color:var(--text-tertiary)")}>{f.res}</div>
                  <div className="num" style={sx("font-size:var(--text-2xl);font-weight:var(--weight-medium);margin-top:var(--space-1)")}>{f.fps}</div>
                </div>
              ))}
            </div>
            <div style={sx("font-size:var(--text-xs);color:var(--text-tertiary)")}>Averages across the current Rigsmith performance model.</div>
          </div>
        )}
      </section>

      <section style={sx("display:flex;flex-direction:column;gap:var(--space-5);min-width:0")}>
        <div style={sx("display:flex;flex-direction:column;gap:var(--space-2)")}>
          <div style={sx("font-size:var(--text-sm);color:var(--text-secondary)")}>{v.pBrand}</div>
          <h1 style={sx("font-size:var(--text-2xl);font-weight:var(--weight-medium);line-height:var(--leading-tight);letter-spacing:var(--tracking);margin:0")}>{v.pModel}</h1>
          <div style={sx("display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);color:var(--text-tertiary)")}>
            <span className="ms" style={sx("font-size:var(--text-sm);color:var(--success)")}>verified</span>
            <span>Canonical catalog product</span>
            <span aria-hidden="true">·</span>
            <span className="num">SKU {v.pSku}</span>
          </div>
        </div>

        <div style={sx("display:flex;align-items:baseline;gap:var(--space-3);padding-bottom:var(--space-4);border-bottom:1px solid var(--border-subtle)")}>
          <span className="num" style={sx("font-size:32px;font-weight:var(--weight-medium);line-height:var(--leading-tight)")}>{v.pPrice}</span>
          <span style={sx(`display:inline-flex;align-items:center;gap:var(--space-1);font-size:var(--text-sm);color:${v.pStockFg}`)}><span style={sx(`width:var(--space-1);height:var(--space-1);border-radius:var(--radius-pill);background:${v.pStockFg}`)}></span>{v.pStock}</span>
        </div>

        <div style={sx("display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--border-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-nav);overflow:hidden")}>
          {v.pFacts.map((f: Vals, i: number) => (
            <div key={i} style={sx("padding:var(--space-3) var(--space-4);display:flex;flex-direction:column;gap:var(--space-1);background:var(--surface-card);min-width:0")}>
              <span style={sx("font-size:var(--text-xs);color:var(--text-tertiary)")}>{f.k}</span>
              <span style={sx("font-size:var(--text-sm);font-weight:var(--weight-medium);overflow:hidden;text-overflow:ellipsis")}>{f.v}</span>
            </div>
          ))}
        </div>

        <div style={sx("display:flex;flex-wrap:wrap;gap:var(--space-2)")}>
          {v.pSpecs.map((spec: string, i: number) => (
            <span key={i} style={sx("display:inline-flex;align-items:center;min-height:var(--space-6);padding:0 var(--space-3);border-radius:var(--radius-pill);background:var(--surface-sunken);color:var(--text-secondary);font-size:var(--text-xs)")}>{spec}</span>
          ))}
        </div>

        <div style={sx("display:flex;flex-direction:column;gap:var(--space-2)")}>
          <div className="pill dark" onClick={v.pAddToBuild} style={sx("height:48px;width:100%;font-size:var(--text-base)")}>{v.pActionLabel}</div>
          <div className="pill ghostb" onClick={v.goCategory} style={sx("height:44px;width:100%;font-size:var(--text-base)")}>Keep looking</div>
        </div>

        <div className="card" style={sx(`padding:var(--space-4);display:flex;gap:var(--space-3);background:${v.pFitBg};border-color:var(--border-subtle)`)}>
          <span className="ms" style={sx(`font-size:var(--text-2xl);color:${v.pFitFg};flex-shrink:0`)}>{v.pFitIcon}</span>
          <div style={sx("font-size:var(--text-sm);color:var(--text-secondary);line-height:var(--leading-normal)")}>{v.pFitText}</div>
        </div>

        <div style={sx("display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm);color:var(--text-secondary);line-height:var(--leading-normal)")}>
          <div style={sx("font-weight:var(--weight-medium);color:var(--text-primary)")}>About this product</div>
          <div>{v.pBlurb}</div>
        </div>
      </section>
    </div>
  </div>
);
