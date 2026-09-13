// src/lib/alerts.js
// Fixed-threshold recession alerts, shown alongside the composite without affecting it.
// Shared with scripts/backtest-composite.mjs, which produces the track records in ALERT_INFO; re-run it after changing a rule.
import { formatObservationDate, formatSigned, shiftMonths } from "./data-transforms.js";

export const ALERT_SERIES = ["T10Y2Y", "SAHMREALTIME", "ICSA"];

const SAHM_THRESHOLD = 0.5;
const CLAIMS_YOY_THRESHOLD = 20;

const average = (points) => points.reduce((sum, d) => sum + d.value, 0) / points.length;

/**
 * Yield curve (T10Y2Y, daily). Triggered when the average over the last month is below 0;
 * Watch when a calendar month within the last 24 months averaged below 0.
 *
 * @param {Array<Object>} spread - Data points ({date, value}), oldest first.
 * @returns {{status: "triggered"|"watch"|"clear", value: number, date: string, lastInvertedMonth: string|null}|null}
 */
export function yieldCurveAlert(spread) {
  if (!spread?.length) return null;

  const lastDate = spread.at(-1).date;
  const recentStart = shiftMonths(lastDate, -1);
  const watchStart = shiftMonths(lastDate, -24).substring(0, 7);

  // Walk back from the latest point only as far as the watch window
  const recent = [];
  const monthly = new Map(); // YYYY-MM -> points, newest month first
  for (let i = spread.length - 1; i >= 0 && spread[i].date.substring(0, 7) >= watchStart; i--) {
    const point = spread[i];
    if (point.date > recentStart) recent.push(point);
    const month = point.date.substring(0, 7);
    if (!monthly.has(month)) monthly.set(month, []);
    monthly.get(month).push(point);
  }

  const value = average(recent);
  const lastInvertedMonth = [...monthly].find(([, points]) => average(points) < 0)?.[0] ?? null;
  const status = value < 0 ? "triggered" : lastInvertedMonth ? "watch" : "clear";
  return { status, value, date: lastDate, lastInvertedMonth };
}

/**
 * Sahm rule, real-time (SAHMREALTIME, monthly). Triggered at 0.5 pp or more.
 *
 * @param {Array<Object>} sahm - Data points ({date, value}), oldest first.
 * @returns {{status: "triggered"|"clear", value: number, date: string}|null}
 */
export function sahmRuleAlert(sahm) {
  if (!sahm?.length) return null;
  const { date, value } = sahm.at(-1);
  return { status: value >= SAHM_THRESHOLD ? "triggered" : "clear", value, date };
}

/**
 * Initial jobless claims (ICSA, weekly). Triggered when the latest 4-week average is 20% or more above
 * the 4-week average 52 weeks earlier.
 *
 * @param {Array<Object>} claims - Weekly data points ({date, value}), oldest first.
 * @returns {{status: "triggered"|"clear", value: number, date: string}|null} value is the YoY % change.
 */
export function claimsAlert(claims) {
  if (!claims || claims.length < 56) return null;
  const fourWeekAverage = (end) => average(claims.slice(end - 3, end + 1));
  const last = claims.length - 1;
  // Rounded before the comparison: floating point turns an exact +20% into 19.999999999999996
  const value = Number(((fourWeekAverage(last) / fourWeekAverage(last - 52) - 1) * 100).toFixed(6));
  return { status: value >= CLAIMS_YOY_THRESHOLD ? "triggered" : "clear", value, date: claims[last].date };
}

// Track records from `npm run backtest` (Sep 2026, revised data). A signal is the first trigger after 12 quiet months;
// it counts when a recession starts within 24 months after it (or up to 3 months before it).
export const ALERT_INFO = {
  yieldCurve: {
    name: "Yield curve",
    rule: "10Y minus 2Y Treasury yield. Triggered when its average over the last month is below 0; Watch when a calendar month averaged below 0 within the last 24 months.",
    history: "Since 1976: 4 of 6 inversions preceded a recession by 14–23 months; false in 1998 and 2022, no new signal before 1981 or 2020.",
  },
  sahm: {
    name: "Sahm rule",
    rule: "Real-time Sahm rule: 3-month average unemployment rate minus its low over the prior 12 months. Triggered at 0.5 pp or more.",
    history: "Since 1966: 7 of 8 signals came within 3 months of a recession start, usually 1–3 months after it; false in 2024.",
  },
  claims: {
    name: "Jobless claims",
    rule: "4-week average of initial jobless claims versus a year earlier. Triggered at +20% or more.",
    history: "Since 1968: 7 of 9 signals came from 10 months before to 3 months after a recession start; false in 1977, 4 months late in 2008.",
  },
};

/**
 * Alert rows for the dashboard, in display order. A rule without enough data comes back as "unavailable".
 *
 * @param {{spread: Array<Object>, sahm: Array<Object>, claims: Array<Object>}} series - T10Y2Y, SAHMREALTIME and ICSA data.
 * @returns {Array<{id: string, name: string, rule: string, history: string, status: string, valueText: string}>}
 */
export function buildAlerts({ spread, sahm, claims }) {
  const curve = yieldCurveAlert(spread);
  const sahmRule = sahmRuleAlert(sahm);
  const claimsRule = claimsAlert(claims);

  const row = (id, result, valueText, historyPrefix = "") => ({
    id,
    ...ALERT_INFO[id],
    status: result ? result.status : "unavailable",
    valueText: result ? valueText : "—",
    history: historyPrefix + ALERT_INFO[id].history,
  });

  return [
    row(
      "yieldCurve",
      curve,
      curve && `${formatSigned(curve.value, 2)} pp`,
      curve?.status === "watch" ? `Last inverted ${formatObservationDate(`${curve.lastInvertedMonth}-01`, "M")}. ` : ""
    ),
    row("sahm", sahmRule, sahmRule && `${formatSigned(sahmRule.value, 2)} pp · ${formatObservationDate(sahmRule.date, "M")}`),
    row("claims", claimsRule, claimsRule && `${formatSigned(claimsRule.value, 1)}% YoY`),
  ];
}
