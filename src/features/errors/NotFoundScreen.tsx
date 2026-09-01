import React from "react";
import type { Vals } from "../../shared/lib/types";
import "./not-found.css";

export const NotFoundScreen: React.FC<{ v: Vals }> = ({ v }) => (
  <main className="not-found-page">
    <img className="not-found-page__brand" src="/branding/Sizel.png" alt="Sizel" />
    <div className="not-found-page__code">404</div>
    <h1>That page is out of stock.</h1>
    <p>We could not find the page you were looking for. The catalog is still here when you are ready.</p>
    <div className="not-found-page__actions">
      <button type="button" className="pill dark" onClick={v.goHome}>Back to Sizel</button>
      <button type="button" className="pill ghostb" onClick={v.goCategory}>Browse products</button>
    </div>
  </main>
);
