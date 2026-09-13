# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MacroPulse: a Next.js 15 (App Router, React 19) dashboard of US macroeconomic indicators pulled from the FRED API. Styling is Tailwind CSS v4 with shadcn/ui ("new-york" style, `components.json`), charts are Recharts, and theming uses next-themes.

## Commands

```bash
./start.sh      # checks Node/API key/deps/port, then runs the dev server (`./start.sh prod` builds and serves; PORT=<port> overrides 3000)
npm run dev     # dev server (Turbopack) at http://localhost:3000
npm run build   # production build (Turbopack)
npm run start   # serve production build
npm run lint    # ESLint (next/core-web-vitals + next/typescript)
```

No test framework is set up.

Requires `NEXT_PUBLIC_FRED_API_KEY` in `.env.local` at the repo root. Without it, `/api/fred` returns a 500 and the dashboard shows "No data available" or "Failed to load data".

## Architecture

**Mixed JS/TS.** The app logic is plain JavaScript (`page.js`, `MacroDashboard.js`, `IndicatorDetail.js`, `src/lib/*.js`, `api/fred/route.js`, `ui/card.js`). Layout, theme components, and most shadcn `ui/*` files are TypeScript. `allowJs` is on, so both work. Import paths use the `@/*` → `src/*` alias.

**Data flow.** All FRED access goes through one server-side proxy:

- `src/app/api/fred/route.js`: `GET /api/fred?series_id=A,B,C[&observation_start=YYYY-MM-DD]`. It fetches every series in parallel, caches upstream responses for 24h (`next: { revalidate: 86400 }`), drops non-numeric observations, and returns `[{ seriesId, data: [{date, value}], fetchedAt }]`. A series that fails comes back with `data: []` instead of failing the whole request. If `observation_start` is omitted it defaults to 20 years ago. There is no point-count `limit`: series have mixed frequencies (daily to quarterly), so callers bound history by date.
- The client components call this route with axios inside `useEffect` (both are `"use client"`). No other data layer exists.

**Indicator registry.** `src/lib/indicators.js` is the single source of truth:
- `INDICATORS`: FRED series id, display name, `weight`, `category` (the dashboard's group sections), `timing` (Leading/Lagging/Coincident/null, used by the timing filter), `frequency` (FRED short code `Q`/`M`/`W`/`D`, used by `formatObservationDate` to label dates, e.g. `Q2 2026` instead of `2026-04-01`), optional `scoreBasis: "yoy"` (score, trend, sparkline and card value use YoY % change instead of the level; set on steadily trending series), and description.
- `INDICATOR_BEHAVIOR`: maps each id to `higher_is_better` or `lower_is_better`, which sets the direction of its score.

To add an indicator, add entries to both. The dashboard fetches every id in `INDICATORS` automatically.

**Scoring (`MacroDashboard.js`).** The dashboard fetches 6 years of history for every indicator in a single request and scores over the last 5.
- Indicators with `scoreBasis: "yoy"` are first converted with `calculateYoY` (the extra year feeds the first year-over-year values). Scoring their raw level would pin the score at 0 or 100, because a trending series is almost always at a 5-year extreme.
- Each indicator's score (0–100) is the percentile rank of its latest value (level, or YoY %) within the 5-year window, inverted for `lower_is_better`.
- If an indicator has fewer than 2 points, its score defaults to 50.
- Trend compares the last two observations.
- Sparklines show only the last 12 points.
- The composite health score is the `weight`-weighted average of all indicator scores. `weight: 0` keeps an indicator's card (marked "not in composite") but excludes it from the composite and the indicator count; a missing weight defaults to 1.

**Detail view (`IndicatorDetail.js`).** Opens as a dialog when you select an indicator. It fetches that series together with `USREC`, which it turns into recession shading bands, plus an optional comparison series. The YoY toggle runs `calculateYoY` (`src/lib/data-transforms.js`), which matches points by `YYYY-MM` one year apart, so it assumes monthly-granularity data. `globalBrushState` lives in `MacroDashboard`, so the chart's brushed date range persists across detail views.

<!-- imported-from: gemini:project:instructions -->
# MacroPulse

MacroPulse is a modern, interactive dashboard built with Next.js that tracks key US macroeconomic indicators in real-time. It aggregates data from the Federal Reserve Economic Data (FRED) API to provide a snapshot of the economic health of the United States.

## Project Overview

-   **Core Functionality:** Displays a comprehensive dashboard of economic metrics grouped by category (Growth & Output, Labor Market, Inflation & Prices, Sentiment & Markets).
-   **Data Analysis:**
    -   **Composite Score:** A weighted average score (0-100) representing the overall economic condition.
    -   **Strength Meter:** Visual percentile rank for each indicator based on historical data (5-year lookback).
    -   **Trend Analysis:** Visual arrows indicating short-term trends and classification (Leading, Lagging, Coincident).
-   **Tech Stack:**
    -   **Framework:** Next.js 15 (App Router)
    -   **Language:** JavaScript (React components) & TypeScript (Configuration/Layouts)
    -   **Styling:** Tailwind CSS v4
    -   **UI Library:** shadcn/ui (Radix UI + Tailwind), Lucide React Icons
    -   **Charts:** Recharts
    -   **Data Fetching:** Axios (via internal API route proxy)

## Architecture

### Directory Structure

-   `src/app`: Contains the App Router pages and API routes.
    -   `page.js`: Main dashboard entry point.
    -   `layout.tsx`: Global layout, including fonts and theme provider.
    -   `api/fred/route.js`: Server-side API route that securely fetches data from the FRED API.
-   `src/components`: React components.
    -   `MacroDashboard.js`: Main dashboard logic and UI composition.
    -   `IndicatorDetail.js`: Modal/view for detailed indicator analysis.
    -   `ui/`: Reusable UI components (from shadcn/ui).
-   `src/lib`: Utility functions (e.g., `utils.ts` for class merging).

### Data Flow

1.  **Client-Side:** `MacroDashboard` component initiates a request to `/api/fred` upon mounting.
2.  **Server-Side:** The API route (`src/app/api/fred/route.js`) handles the request, querying the external FRED API using an API key (likely stored in environment variables).
3.  **Processing:** The client receives raw data, calculates scores (percentile ranks), determines trends, and renders the UI.

## Development

### Prerequisites

-   Node.js (v18+ recommended)
-   npm, yarn, pnpm, or bun
-   **FRED API Key:** Required for fetching data. Should be configured in `.env.local` (variable name `NEXT_PUBLIC_FRED_API_KEY`).

### Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with Turbopack. |
| `npm run build` | Builds the application for production. |
| `npm start` | Starts the production server. |
| `npm run lint` | Runs ESLint to check for code quality issues. |

### Coding Conventions

-   **Styling:** Use Tailwind CSS utility classes. For conditional or complex class merging, use the `cn()` utility from `src/lib/utils.ts`.
-   **Components:** functional components using React hooks (`useState`, `useEffect`).
-   **Theme:** Supports light and dark modes via `next-themes`. Ensure UI elements look good in both modes.
-   **Imports:** Use absolute imports (aliased with `@/`) as defined in `tsconfig.json` (e.g., `@/components/...`, `@/lib/...`).

## Key Configuration Files

-   `next.config.ts`: Next.js configuration.
-   `components.json`: Configuration for shadcn/ui components.
-   `package.json`: Dependencies and scripts.
-   `tailwind.config.js` (or implicit via v4): Tailwind settings.
