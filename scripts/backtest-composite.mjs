// Backtests the composite bands, cycle breakdown, breadth and recession alerts on FRED history.
// Run with `npm run backtest` from the repo root (reads NEXT_PUBLIC_FRED_API_KEY from .env.local).
// Its output feeds BACKTEST and COMPOSITE_BANDS in src/lib/scoring.js and ALERT_INFO in src/lib/alerts.js;
// re-run it after changing indicators, weights or formulas. It uses revised data and ignores publication lags,
// so real-time readings would have looked worse than these results.
import { INDICATORS } from "../src/lib/indicators.js";
import { calculateBreadth, calculateComposite, calculateScore, COMPOSITE_BANDS } from "../src/lib/scoring.js";
import { calculateTrend, calculateYoY, shiftMonths, toRealLevels } from "../src/lib/data-transforms.js";
import { ALERT_SERIES, claimsAlert, sahmRuleAlert, yieldCurveAlert } from "../src/lib/alerts.js";

const COMPOSITE_START = "2000-01";
const INDICATOR_HISTORY_START = "1993-01-01"; // 5-year window plus a year for YoY before 2000
const ALERT_HISTORY_START = "1966-01-01";

process.loadEnvFile(".env.local");
const apiKey = process.env.NEXT_PUBLIC_FRED_API_KEY;
if (!apiKey) throw new Error("NEXT_PUBLIC_FRED_API_KEY is missing from .env.local");

async function fetchSeries(id, observationStart) {
  const params = new URLSearchParams({ series_id: id, api_key: apiKey, file_type: "json", observation_start: observationStart });
  const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?${params}`);
  const json = await res.json();
  if (!res.ok) throw new Error(`FRED ${id}: ${json.error_message ?? res.status}`);
  return json.observations.filter((o) => o.value !== ".").map((o) => ({ date: o.date, value: Number(o.value) }));
}

async function fetchAll(ids, observationStart) {
  const entries = await Promise.all([...new Set(ids)].map(async (id) => [id, await fetchSeries(id, observationStart)]));
  return Object.fromEntries(entries);
}

// Observations dated on or before `date` (series are sorted by date)
function upTo(series, date) {
  let lo = 0;
  let hi = series.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid].date <= date) lo = mid + 1;
    else hi = mid;
  }
  return series.slice(0, lo);
}

const pct = (count, total) => (total ? `${Math.round((100 * count) / total)}%` : "–");
const mean = (values) => (values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : NaN);
const signed = (value) => `${value >= 0.5 ? "+" : ""}${Math.round(value)}`;

const [indicatorData, alertData] = await Promise.all([
  fetchAll(INDICATORS.flatMap((i) => [i.id, i.deflator].filter(Boolean)), INDICATOR_HISTORY_START),
  fetchAll([...ALERT_SERIES, "USREC"], ALERT_HISTORY_START),
]);

// Monthly recession calendar
const months = alertData.USREC.map((d) => d.date.substring(0, 7));
const inRecession = alertData.USREC.map((d) => d.value === 1);
const recessionStarts = inRecession.flatMap((rec, i) => (i > 0 && rec && !inRecession[i - 1] ? [i] : []));

// ---- Composite, cycle breakdown and breadth ----

const prepared = Object.fromEntries(
  INDICATORS.map((meta) => {
    const levels = meta.deflator ? toRealLevels(indicatorData[meta.id], indicatorData[meta.deflator]) : indicatorData[meta.id];
    return [meta.id, meta.scoreBasis === "yoy" ? calculateYoY(levels) : levels];
  })
);

const rows = [];
for (let i = 0; i < months.length; i++) {
  if (months[i] < COMPOSITE_START) continue;
  const end = `${months[i]}-31`;
  const start = shiftMonths(end, -60);
  const scored = INDICATORS.map((meta) => {
    const window = prepared[meta.id].filter((d) => d.date >= start && d.date <= end);
    return { ...meta, score: calculateScore(meta.id, window), trend: calculateTrend(window).direction };
  });
  rows.push({
    index: i,
    month: months[i],
    composite: Math.round(calculateComposite(scored)),
    coincident: calculateComposite(scored, "Coincident"),
    netImproving: calculateBreadth(scored).netImproving,
    recession: inRecession[i],
    preRecession: !inRecession[i] && recessionStarts.some((s) => s - i >= 1 && s - i <= 12),
    // Recession within the next 12 months (this month included); undefined when the calendar ends first
    recessionAhead: i + 11 < months.length ? inRecession.slice(i, i + 12).some(Boolean) : undefined,
  });
}

const composites = rows.map((r) => r.composite).sort((a, b) => a - b);
console.log(`\nComposite ${rows[0].month}..${rows.at(-1).month} (${rows.length} months; recession starts ${recessionStarts.filter((s) => s >= rows[0].index).map((s) => months[s]).join(", ")})`);
console.log(`  median ${composites[Math.floor(composites.length / 2)]}`);
console.log("  band                      months  in recession  recession within 12m (months with a full 12m ahead)");
const bandsAscending = [...COMPOSITE_BANDS].sort((a, b) => a.min - b.min);
bandsAscending.forEach((band, k) => {
  const upper = k + 1 < bandsAscending.length ? bandsAscending[k + 1].min - 1 : 100;
  const inBand = rows.filter((r) => r.composite >= band.min && r.composite <= upper);
  const withForward = inBand.filter((r) => r.recessionAhead !== undefined);
  console.log(
    `  ${`${band.label} ${band.min}–${upper}`.padEnd(26)}${String(inBand.length).padEnd(8)}${pct(inBand.filter((r) => r.recession).length, inBand.length).padEnd(14)}${pct(withForward.filter((r) => r.recessionAhead).length, withForward.length)} (n=${withForward.length})`
  );
});

const groups = {
  expansion: rows.filter((r) => !r.recession && !r.preRecession),
  "year before recession": rows.filter((r) => r.preRecession),
  recession: rows.filter((r) => r.recession),
};
console.log("\n  averages                  coincident  net improving %");
for (const [name, group] of Object.entries(groups)) {
  console.log(`  ${`${name} (${group.length})`.padEnd(26)}${String(Math.round(mean(group.map((r) => r.coincident)))).padEnd(12)}${signed(mean(group.map((r) => r.netImproving)))}`);
}
const latest = rows.at(-1);
console.log(`  latest month ${latest.month}: composite ${latest.composite}, coincident ${Math.round(latest.coincident)}, net improving ${signed(latest.netImproving)}%`);

// ---- Recession alerts ----

// Month -> true/false (null before the series starts or when the month has no observation)
function monthlyTriggers(series, evaluate) {
  const triggers = new Map();
  for (const month of months) {
    const history = upTo(series, `${month}-31`);
    if (!history.length || !history.at(-1).date.startsWith(month)) continue;
    triggers.set(month, evaluate(history)?.status === "triggered");
  }
  return triggers;
}

// A weekly rule triggers a month when any of its weeks triggers
function weeklyTriggers(series, evaluate) {
  const triggers = new Map();
  for (let i = 0; i < series.length; i++) {
    const result = evaluate(series.slice(Math.max(0, i - 60), i + 1));
    if (!result) continue;
    const month = series[i].date.substring(0, 7);
    triggers.set(month, (triggers.get(month) ?? false) || result.status === "triggered");
  }
  return triggers;
}

function summarize(name, triggers, latestResult) {
  const covered = months.map((month, index) => ({ index, triggered: triggers.get(month) })).filter((r) => r.triggered !== undefined);
  const firstIndex = covered[0].index;

  // A signal is the first triggered month after at least 12 months without one
  const signals = [];
  let lastTriggered = -Infinity;
  for (const r of covered) {
    if (!r.triggered) continue;
    if (r.index - lastTriggered >= 12) signals.push(r.index);
    lastTriggered = r.index;
  }

  const lines = signals.map((i) => {
    const start = recessionStarts.find((s) => s >= i - 3);
    const lead = start === undefined ? null : start - i;
    if (lead !== null && lead <= 24) return { kind: "hit", text: `${months[i]} ${lead >= 0 ? `lead ${lead}m` : `${-lead}m after start`} (${months[start]})` };
    if (i + 24 >= months.length) return { kind: "pending", text: `${months[i]} pending (under 24 months ago)` };
    return { kind: "false", text: `${months[i]} false` };
  });
  const missed = recessionStarts.filter((s) => s >= firstIndex + 24 && !signals.some((i) => s - i >= -3 && s - i <= 24));

  const count = (kind) => lines.filter((l) => l.kind === kind).length;
  console.log(`\n${name} (from ${months[firstIndex]}): ${signals.length} signals · ${count("hit")} hit · ${count("false")} false · ${count("pending")} pending · missed ${missed.map((s) => months[s]).join(", ") || "none"}`);
  console.log(`  ${lines.map((l) => l.text).join("\n  ")}`);
  console.log(`  now: ${JSON.stringify(latestResult)}`);
}

summarize("Yield curve inverted", monthlyTriggers(alertData.T10Y2Y, yieldCurveAlert), yieldCurveAlert(alertData.T10Y2Y));
summarize("Sahm rule >= 0.5", monthlyTriggers(alertData.SAHMREALTIME, sahmRuleAlert), sahmRuleAlert(alertData.SAHMREALTIME));
summarize("Jobless claims 4wk avg YoY >= 20%", weeklyTriggers(alertData.ICSA, claimsAlert), claimsAlert(alertData.ICSA));
