import React from "react";
import "../reviews.css";

/**
 * Five stars with a partial fill for the fraction, the way a retail listing
 * shows an average. The fill is a width clip over a solid row, so half a star
 * reads correctly instead of rounding to the nearest whole one.
 */
export const Stars: React.FC<{ value: number; size?: number }> = ({ value, size = 14 }) => (
  <span className="stars" style={{ fontSize: size }} role="img" aria-label={`${value} out of 5`}>
    <span className="stars__track">{"★★★★★"}</span>
    <span className="stars__fill" style={{ width: `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` }}>{"★★★★★"}</span>
  </span>
);

/** Average, stars and the number of ratings on one line. */
export const RatingLine: React.FC<{ average: number; count: number; size?: number; onClick?: () => void }> = ({ average, count, size, onClick }) => (
  <span className="rating-line">
    <Stars value={average} size={size} />
    <strong className="num">{average.toFixed(1)}</strong>
    {onClick
      ? <button type="button" className="rating-line__count num" onClick={onClick}>{count} ratings</button>
      : <span className="rating-line__count num">{count}×</span>}
  </span>
);
