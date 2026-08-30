import React from "react";
// ADR 0005: search interaction is owned by the search feature.
// docs/decisions/0005-feature-first-source-layout.md
import { createPortal } from "react-dom";
import type { Vals } from "../../shared/lib/types";

export const SearchBox: React.FC<{ v: Vals }> = ({ v }) => {
  const [open, setOpen] = React.useState(false);
  const holder = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (!holder.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", away);
      window.removeEventListener("keydown", escape);
    };
  }, [open]);

  const search = (query: string) => {
    v.runSearch(query);
    setOpen(false);
  };

  return (
    <>
      {open && createPortal(
        <button type="button" className="search-page-scrim" aria-label="Close search suggestions" onClick={() => setOpen(false)} />,
        document.body,
      )}
      {open && <button type="button" className="search-scrim" aria-label="Close search suggestions" onClick={() => setOpen(false)} />}
      <div ref={holder} className={`topbar-search-wrap ${open ? "is-open" : ""}`}>
        <div className="topbar-search">
          <span className="ms">search</span>
          <input
            aria-label="Search products"
            aria-expanded={open}
            aria-controls="search-flyout"
            value={v.searchValue}
            onChange={v.searchChange}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onKeyDown={(event) => { if (event.key === "Enter") search(v.searchValue); }}
            placeholder="Search parts, brands, or builds"
          />
          {v.searchValue && <button type="button" className="topbar-search__clear" aria-label="Clear search" onClick={() => v.searchChange({ target: { value: "" } })}><span className="ms">close</span></button>}
        </div>

        {open && (
          <section id="search-flyout" className="search-flyout" aria-label="Search suggestions">
            <div className="search-flyout__section">
              <span className="eyebrow">Recent searches</span>
              <div className="search-recent" role="list">
                {v.recentSearches.map((query: string) => (
                  <button key={query} type="button" role="listitem" onClick={() => search(query)}>
                    <span className="ms">history</span>{query}
                  </button>
                ))}
              </div>
            </div>
            <div className="search-flyout__section search-flyout__section--products">
              <span className="eyebrow">Recommended products</span>
              <div className="search-products">
                {v.searchRecommendations.map((product: Vals) => (
                  <button key={`${product.id}-${product.name}`} type="button" onClick={() => { setOpen(false); product.go(); }}>
                    <span>{product.image ? <img src={product.image} alt="" /> : <span className="ms">image</span>}</span>
                    <strong>{product.name}</strong>
                    <span className="ms">arrow_forward</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
};
