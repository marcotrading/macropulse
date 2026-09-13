// src/lib/scoring.js
// Shared by the dashboard and scripts/backtest-composite.mjs, so both score with the same formulas.
import { INDICATOR_BEHAVIOR } from "./indicators.js";

/**
 * 0–100 score of the latest value within its window: the midrank percentile against the other n-1 points,
 * inverted for lower_is_better. The window low scores 0 and the high 100; ties count half, so repeated values
 * (e.g. an unchanged policy rate) land mid-tie instead of at its bottom.
 *
 * @param {string} id - FRED series id (sets the direction via INDICATOR_BEHAVIOR).
 * @param {Array<Object>} history - Window of data points ({date, value}), oldest first.
 * @returns {number} Score, or 50 when the window has fewer than 2 points.
 */
export function calculateScore(id, history) {
  if (history.length < 2) return 50;

  const behavior = INDICATOR_BEHAVIOR[id] || "higher_is_better";
  const latestValue = history.at(-1).value;

  const below = history.filter((h) => h.value < latestValue).length;
  const equalOthers = history.filter((h) => h.value === latestValue).length - 1;
  const percentile = ((below + 0.5 * equalOthers) / (history.length - 1)) * 100;

  return behavior === "lower_is_better" ? 100 - percentile : percentile;
}

/**
 * Weighted average of indicator scores. weight 0 excludes an indicator; only a missing weight defaults to 1.
 *
 * @param {Array<{score: number, weight?: number, timing?: string|null}>} indicators - Scored indicators.
 * @param {string} [timing] - Restrict to one timing group ("Leading", "Coincident" or "Lagging").
 * @returns {number|null} Unrounded composite, or null when no included indicator carries weight.
 */
export function calculateComposite(indicators, timing) {
  const included = indicators.filter((i) => (i.weight ?? 1) > 0 && (!timing || i.timing === timing));
  const totalWeight = included.reduce((sum, i) => sum + (i.weight ?? 1), 0);
  if (totalWeight === 0) return null;
  return included.reduce((sum, i) => sum + i.score * (i.weight ?? 1), 0) / totalWeight;
}

/**
 * Breadth of the composite's indicators (weight > 0): each 3-month trend counts as improving or worsening
 * according to whether higher or lower is better for that indicator.
 *
 * @param {Array<{id: string, score: number, trend: "up"|"down"|"right", weight?: number}>} indicators - Scored indicators.
 * @returns {{total: number, improving: number, worsening: number, flat: number, strong: number, netImproving: number}}
 *   strong counts scores of 50 or more; netImproving is (improving − worsening) as a % of total.
 */
export function calculateBreadth(indicators) {
  const included = indicators.filter((i) => (i.weight ?? 1) > 0);
  let improving = 0;
  let worsening = 0;
  for (const indicator of included) {
    const goodDirection = INDICATOR_BEHAVIOR[indicator.id] === "lower_is_better" ? "down" : "up";
    if (indicator.trend === goodDirection) improving++;
    else if (indicator.trend !== "right") worsening++;
  }
  const total = included.length;
  return {
    total,
    improving,
    worsening,
    flat: total - improving - worsening,
    strong: included.filter((i) => i.score >= 50).length,
    netImproving: total ? ((improving - worsening) / total) * 100 : 0,
  };
}

// From `npm run backtest` (Sep 2026): monthly composite 2000–2026 with the current indicators, weights and formulas.
// Indicative only: revised data, no publication lags, 3 recessions. Re-run after changing indicators, weights or formulas.
// expansion = months neither in recession nor in the 12 months before one.
export const BACKTEST = {
  compositeMedian: 48,
  coincident: { expansion: 51, preRecession: 32 },
  netImproving: { expansion: 2, preRecession: -16 },
};

// recessionRate: % of months in the band with a recession within the next 12 months (null: none since 2000).
export const COMPOSITE_BANDS = [
  { min: 66, label: "Strong Expansion", text: "text-emerald-600", ring: "text-emerald-500", recessionRate: null },
  { min: 55, label: "Solid Expansion", text: "text-green-600", ring: "text-green-500", recessionRate: null },
  { min: 45, label: "Moderate", text: "text-amber-600", ring: "text-amber-500", recessionRate: 13 },
  { min: 33, label: "Slowing", text: "text-orange-600", ring: "text-orange-500", recessionRate: 22 },
  { min: 0, label: "Contraction", text: "text-rose-600", ring: "text-rose-500", recessionRate: 97 },
];

export const getCompositeBand = (score) => COMPOSITE_BANDS.find((band) => score >= band.min);
