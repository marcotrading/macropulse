# MacroPulse

MacroPulse is a modern, interactive dashboard built with Next.js that tracks key US macroeconomic indicators in real-time. It aggregates data from the Federal Reserve Economic Data (FRED) API to provide a comprehensive snapshot of the economic health of the United States.

## Features

-   **Real-time Dashboard:** Visualize economic metrics grouped by category:
    -   Growth & Output
    -   Labor Market
    -   Inflation & Prices
    -   Sentiment & Markets
-   **Composite Health Score:** A weighted average score (0-100) representing the overall economic condition.
-   **Trend Analysis:** Visual indicators for short-term trends (Leading, Lagging, Coincident).
-   **Strength Meter:** Visual percentile rank for each indicator based on a 5-year historical lookback.
-   **Interactive Charts:** Detailed historical views using Recharts.
-   **Dark Mode Support:** Fully responsive design with light and dark themes.

## Tech Stack

-   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
-   **Language:** JavaScript (React components) & TypeScript (Configuration)
-   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
-   **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind)
-   **Icons:** [Lucide React](https://lucide.dev/)
-   **Charting:** [Recharts](https://recharts.org/)
-   **Data Fetching:** [Axios](https://axios-http.com/)

## Getting Started

### Prerequisites

-   Node.js (v18 or higher recommended)
-   npm, yarn, pnpm, or bun
-   **FRED API Key:** You need an API key from [FRED (Federal Reserve Economic Data)](https://fred.stlouisfed.org/docs/api/api_key.html).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/macro-dashboard.git
    cd macro-dashboard
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    Create a `.env.local` file in the root directory and add your FRED API key:
    ```env
    NEXT_PUBLIC_FRED_API_KEY=your_api_key_here
    ```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the dashboard.

## Project Structure

-   `src/app`: App Router pages and API routes.
    -   `page.js`: Main dashboard entry point.
    -   `api/fred/route.js`: Server-side proxy for secure FRED API requests.
-   `src/components`: React components including the main dashboard and detailed views.
-   `src/lib`: Utility functions and data transformation logic.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).