import React from "react";
import "./storefront-skeleton.css";

/** A short startup state for the catalogue shell. It keeps the first paint calm. */
export const StorefrontSkeleton: React.FC = () => (
  <main className="storefront-skeleton" aria-label="Loading Sizel" aria-busy="true">
    <div className="storefront-skeleton__topbar">
      <span className="storefront-skeleton__logo">Sizel</span>
      <span className="skeleton-block storefront-skeleton__search" />
      <span className="storefront-skeleton__tools"><i /><i /><i /></span>
    </div>
    <div className="storefront-skeleton__layout">
      <aside className="storefront-skeleton__rail">
        <span className="skeleton-block storefront-skeleton__rail-toggle" />
        {Array.from({ length: 8 }, (_, index) => <span className="skeleton-block storefront-skeleton__rail-item" key={index} />)}
      </aside>
      <section className="storefront-skeleton__content">
        <div className="skeleton-block storefront-skeleton__hero" />
        <div className="storefront-skeleton__heading"><span className="skeleton-block" /><span className="skeleton-block" /></div>
        <div className="storefront-skeleton__cards">
          {Array.from({ length: 3 }, (_, index) => <article className="storefront-skeleton__card" key={index}>
            <span className="skeleton-block storefront-skeleton__image" />
            <span className="skeleton-block storefront-skeleton__line storefront-skeleton__line--long" />
            <span className="skeleton-block storefront-skeleton__line" />
            <span className="skeleton-block storefront-skeleton__price" />
          </article>)}
        </div>
      </section>
    </div>
  </main>
);
