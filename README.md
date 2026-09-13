# MacroPulse

A dashboard of US macroeconomic indicators built on [FRED](https://fred.stlouisfed.org/) data. It scores each indicator against its own recent history and rolls the scores into one composite health score.

## What it shows

- **25 indicators** in four groups: Growth & Output, Labor Market, Inflation & Prices, Sentiment & Markets.
- **Strength score (0–100)** per indicator: the percentile rank of the latest value within the last 5 years, flipped where lower is better (e.g. unemployment, CPI).
  - Steadily trending series (GDP, payrolls, CPI, M2…) are scored on year-over-year % change, since their raw level is almost always at a 5-year high.
- **Composite health score:** weighted average of the strength scores. Some cards are shown for context only, marked "not in composite".
- **Timing filter:** Leading, Coincident or Lagging.
- **Detail view:** 10-year chart with recession shading, a YoY toggle and an optional comparison series.

Data is cached for 24 hours, so this is a daily snapshot, not a live feed.

## Getting started

Requires Node.js 18.18+ and a free [FRED API key](https://fred.stlouisfed.org/docs/api/api_key.html).

```bash
git clone https://github.com/marcotrading/macropulse.git
cd macropulse
echo "NEXT_PUBLIC_FRED_API_KEY=your_api_key_here" > .env.local
./start.sh
```

Then open http://localhost:3000.

`start.sh` checks Node, the API key, dependencies and the port before starting the dev server.
- `./start.sh prod` builds and serves a production build.
- `PORT=4000 ./start.sh` uses a different port.

## Customizing indicators

All indicators live in `src/lib/indicators.js`. To add one:
1. Add an entry to `INDICATORS` with the FRED series id, weight, category, timing and frequency.
2. Add its direction (`higher_is_better` / `lower_is_better`) to `INDICATOR_BEHAVIOR`.

Set `weight: 0` to show a card without counting it in the composite.

## Tech stack

Next.js 15 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Recharts. All FRED requests go through a server-side proxy at `src/app/api/fred/route.js`.
