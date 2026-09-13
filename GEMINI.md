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
