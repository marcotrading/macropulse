// src/lib/data-transforms.js

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats a FRED observation date for its series frequency.
 * FRED dates quarterly and monthly observations by the period's first day, and weekly ones by the week's last day.
 * The string is parsed directly: new Date("YYYY-MM-DD") is UTC midnight, which shifts to the previous day west of UTC.
 *
 * @param {string} date - Observation date (YYYY-MM-DD).
 * @param {"Q"|"M"|"W"|"D"} frequency - FRED short frequency code.
 * @param {boolean} [compact=false] - Period-only label (e.g. for chart axes): weekly and daily dates render as "Aug 2026".
 * @returns {string} e.g. "Q2 2026", "Aug 2026", "Week ending Sep 6, 2026", "Sep 10, 2026".
 */
export function formatObservationDate(date, frequency, compact = false) {
  if (!date) return "";

  const [year, month, day] = date.split("-").map(Number);
  const monthName = MONTHS[month - 1];

  if (frequency === "Q") return `Q${Math.ceil(month / 3)} ${year}`;
  if (frequency === "M" || compact) return `${monthName} ${year}`;

  const fullDate = `${monthName} ${day}, ${year}`;
  return frequency === "W" ? `Week ending ${fullDate}` : fullDate;
}

/**
 * Calculates Year-over-Year (YoY) percentage change for a given data series.
 *
 * @param {Array<Object>} data - An array of data points, each with 'date' (YYYY-MM-DD) and 'value'.
 * @returns {Array<Object>} A new array with YoY percentage change, or an empty array if not enough data.
 */
export function calculateYoY(data) {
  if (!data || data.length === 0) {
    return [];
  }

  const yoyData = [];
  const monthlyData = new Map(); // Store data by YYYY-MM for easy lookup

  // Populate monthlyData map
  data.forEach(item => {
    monthlyData.set(item.date.substring(0, 7), item.value); // Key: YYYY-MM
  });

  // Calculate YoY for every point whose same month one year earlier is available.
  // No fixed index offset: a quarterly series finds its year-ago value 4 points back, not 12.
  data.forEach(currentItem => {
    const prevYearMonth = `${Number(currentItem.date.substring(0, 4)) - 1}${currentItem.date.substring(4, 7)}`;
    const prevYearValue = monthlyData.get(prevYearMonth);

    if (prevYearValue !== undefined && prevYearValue !== 0) {
      const yoyChange = ((currentItem.value - prevYearValue) / prevYearValue) * 100;
      yoyData.push({
        date: currentItem.date,
        value: parseFloat(yoyChange.toFixed(2)), // Round to 2 decimal places
      });
    }
  });

  return yoyData;
}

/**
 * Converts nominal levels to real terms with a monthly price index, in the dollars of the latest converted month.
 * Months are matched by YYYY-MM; points whose month has no price yet are dropped.
 * The YoY % change of the result equals the nominal YoY deflated by the index's YoY, whatever the base month.
 *
 * @param {Array<Object>} data - Nominal data points ({date, value}), oldest first.
 * @param {Array<Object>} priceIndex - Price index data points ({date, value}).
 * @returns {Array<Object>} Real data points ({date, value}).
 */
export function toRealLevels(data, priceIndex) {
  if (!data?.length || !priceIndex?.length) return [];

  const prices = new Map(priceIndex.map((p) => [p.date.substring(0, 7), p.value]));
  const matched = data.filter((d) => prices.get(d.date.substring(0, 7)));
  if (matched.length === 0) return [];

  const basePrice = prices.get(matched.at(-1).date.substring(0, 7));
  return matched.map((d) => ({
    date: d.date,
    value: parseFloat(((d.value * basePrice) / prices.get(d.date.substring(0, 7))).toFixed(2)),
  }));
}

/**
 * Formats a number with an explicit sign ("+1.2", "-0.8"), printing values that round to zero as "0" rather than "-0".
 *
 * @param {number} value - Number to format.
 * @param {number} [digits=0] - Decimal places.
 * @returns {string} Signed number.
 */
export function formatSigned(value, digits = 0) {
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) return (0).toFixed(digits);
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(digits)}`;
}

/**
 * Shifts a YYYY-MM-DD string by whole months, without Date objects (no timezone shifts).
 * The day is kept as-is, so "2026-05-31" minus 3 months gives "2026-02-31"; that still compares correctly as a string bound.
 *
 * @param {string} date - Date (YYYY-MM-DD).
 * @param {number} months - Months to add (negative to go back).
 * @returns {string} Shifted date (YYYY-MM-DD).
 */
export function shiftMonths(date, months) {
  const [year, month, day] = date.split("-").map(Number);
  const total = year * 12 + (month - 1) + months;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * 3-month trend: the average of the last month of observations vs the average of the month ending 3 months earlier,
 * both anchored on the latest observation date. For monthly data that is the latest value vs 3 months back; for quarterly, the previous quarter.
 * Changes within 5% of the series' range are treated as flat.
 *
 * @param {Array<Object>} history - Data points ({date, value}), oldest first.
 * @returns {{direction: "up"|"down"|"right", change: number|null}} change is null when there is no observation 3 months back.
 */
export function calculateTrend(history) {
  if (!history || history.length < 2) return { direction: "right", change: null };

  const lastDate = history.at(-1).date;
  const recent = history.filter((d) => d.date > shiftMonths(lastDate, -1));
  const earlier = history.filter((d) => d.date > shiftMonths(lastDate, -4) && d.date <= shiftMonths(lastDate, -3));
  if (earlier.length === 0) return { direction: "right", change: null };

  const average = (points) => points.reduce((sum, d) => sum + d.value, 0) / points.length;
  const change = average(recent) - average(earlier);
  const values = history.map((d) => d.value);
  const flatBand = 0.05 * (Math.max(...values) - Math.min(...values));

  // <= so an unchanging series (range 0, change 0) reads flat
  const direction = Math.abs(change) <= flatBand ? "right" : change > 0 ? "up" : "down";
  return { direction, change };
}
