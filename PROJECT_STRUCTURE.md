# Project Structure

```
macro-dashboard/
├── start.sh                    # Launcher: checks Node/API key/deps/port, then dev (default) or prod
├── .env.local                  # NEXT_PUBLIC_FRED_API_KEY (not committed)
├── CLAUDE.md                   # Guidance for Claude Code
├── GEMINI.md                   # Guidance for Gemini
├── PROJECT_STRUCTURE.md        # This file
├── README.md
├── components.json             # shadcn/ui config ("new-york" style)
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs          # Tailwind CSS v4 via @tailwindcss/postcss
├── tsconfig.json               # allowJs, @/* → src/* alias
├── public/                     # Static assets (Create Next App SVGs)
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
└── src/
    ├── .env.local              # Not loaded by Next.js (only the repo-root .env.local is)
    ├── app/
    │   ├── api/fred/route.js   # Server-side FRED proxy: GET /api/fred?series_id=A,B[&observation_start=]
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx          # Fonts + theme provider
    │   └── page.js             # Dashboard entry point
    ├── components/
    │   ├── MacroDashboard.js   # Fetching, scoring, dashboard UI
    │   ├── IndicatorDetail.js  # Detail dialog: history chart, recessions, comparison, YoY
    │   ├── mode-toggle.tsx     # Light/dark switch
    │   ├── theme-provider.tsx  # next-themes wrapper
    │   └── ui/                 # shadcn/ui components
    │       ├── card.js
    │       ├── dialog.tsx
    │       ├── select.tsx
    │       ├── switch.tsx
    │       └── tooltip.tsx
    └── lib/
        ├── data-transforms.js  # calculateYoY, formatObservationDate
        ├── indicators.js       # INDICATORS registry + INDICATOR_BEHAVIOR
        └── utils.ts            # cn() class merging
```
