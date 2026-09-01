import type { Part } from "../../shared/lib/types";

/**
 * Customer ratings for the fictional catalog.
 *
 * The catalog carries no review data, so ratings are derived from the product
 * id with a stable hash. That matters more than it sounds: a random rating
 * would change on every render, so the same product would score differently on
 * the listing and on its own page, and a tool reading it would disagree with
 * the screen. Same id, same numbers, always.
 */

const hash = (text: string) => {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
};

/** A stable number in [0, 1) for one product and one purpose. */
const seeded = (id: string, salt: string) => (hash(`${id}:${salt}`) % 10000) / 10000;

/**
 * Storage tiers of one device are separate listings but the same hardware, so
 * they are reviewed as one product rather than each tier scoring differently.
 */
const reviewId = (product: Part) => product.variantOf ?? product.id;

export interface Rating {
  /** Average score, one decimal, 3.4 to 5.0. */
  average: number;
  /** How many people rated it. */
  count: number;
  /** Share of each star band, 5 down to 1, as percentages that total 100. */
  distribution: { stars: number; percent: number }[];
}

export function ratingFor(product: Part): Rating {
  const base = seeded(reviewId(product), "score");
  // Well-reviewed catalogue: most products land between 4.0 and 5.0.
  const average = Math.round((3.4 + base * 1.6) * 10) / 10;
  const count = 6 + Math.floor(seeded(reviewId(product), "count") * 320);

  // Skew the distribution towards the average rather than inventing noise.
  const weights = [5, 4, 3, 2, 1].map(stars => Math.max(0.5, 10 - Math.abs(stars - average) * 7));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const percents = weights.map(weight => Math.round((weight / total) * 100));
  percents[0] += 100 - percents.reduce((sum, value) => sum + value, 0);

  return {
    average,
    count,
    distribution: [5, 4, 3, 2, 1].map((stars, index) => ({ stars, percent: percents[index] })),
  };
}

export interface Review {
  id: string;
  author: string;
  initials: string;
  stars: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
}

const AUTHORS = [
  "Mark H.", "Emily N.", "Thomas L.", "Jane K.", "David R.",
  "Lucy B.", "Oliver S.", "Catherine M.", "Felix V.", "Emma D.",
];

const HEADLINES = [
  "Exactly what I expected",
  "Great value for the money",
  "Solid, no complaints",
  "Does the job well",
  "Happy with the purchase",
  "Better than I hoped",
];

const BODIES = [
  "Arrived on the promised day and works as described. The specifications on the page matched what I got.",
  "Been using it for a few weeks now without a single problem. Packaging was sensible and nothing was loose.",
  "Fair price for what it does. I compared it against two others and this one made the most sense.",
  "Setup took ten minutes. The listing described it accurately, which is more than I can say for most shops.",
  "Quiet, well built and it fits where I needed it to. Would buy from here again.",
  "Not the cheapest option but the quality shows. No regrets after a month of daily use.",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

/** A short, stable set of written reviews for the product page. */
export function reviewsFor(product: Part, limit = 4): Review[] {
  const rating = ratingFor(product);
  return Array.from({ length: limit }, (_, index) => {
    const salt = `review-${index}`;
    const page = Math.floor(index / 4);
    const verifiedPageOffset = Math.floor(seeded(reviewId(product), `verified-page-${page}`) * 4);
    const pick = <T,>(list: T[], key: string) => list[Math.floor(seeded(reviewId(product), `${salt}:${key}`) * list.length)];
    const drift = seeded(reviewId(product), `${salt}:drift`);
    const stars = Math.max(3, Math.min(5, Math.round(rating.average + (drift < 0.25 ? -1 : 0))));
    const day = 1 + Math.floor(seeded(reviewId(product), `${salt}:day`) * 27);
    return {
      id: `${reviewId(product)}-${index}`,
      author: pick(AUTHORS, "author"),
      initials: pick(AUTHORS, "author").split(" ")[0].slice(0, 1) + pick(AUTHORS, "author").split(" ")[1][0],
      stars,
      title: pick(HEADLINES, "title"),
      body: pick(BODIES, "body"),
      date: `${day} ${pick(MONTHS, "month")} 2026`,
      // Retail-style pagination: one stable-but-randomly positioned verified
      // purchase per page of four.
      verified: index % 4 === verifiedPageOffset,
    };
  });
}
