import { NextResponse } from "next/server";

const FRED_API = "https://api.stlouisfed.org/fred/series/observations";
const API_KEY = process.env.NEXT_PUBLIC_FRED_API_KEY || "";

/**
 * Supports:
 * - /api/fred?series_id=GDP  (single series)
 * - /api/fred?series_id=GDP,CPIAUCSL,UNRATE  (multiple series, comma-separated)
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const seriesParam = searchParams.get("series_id");
  let observation_start = searchParams.get("observation_start");

  if (!API_KEY) {
    return NextResponse.json(
      { error: "Missing FRED API key" },
      { status: 500 }
    );
  }

  // Protect against large payloads: Default to 20 years if no start date is provided
  if (!observation_start) {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 20);
    observation_start = cutoffDate.toISOString().split("T")[0];
  }

  if (!seriesParam) {
    return NextResponse.json(
      { error: "Missing series_id parameter" },
      { status: 400 }
    );
  }

  const seriesList = seriesParam.split(",");

  try {
    const results = await Promise.all(
      seriesList.map(async (seriesId) => {
        try {
          const params = new URLSearchParams({
            series_id: seriesId,
            api_key: API_KEY,
            file_type: "json",
            observation_start,
          });

          const res = await fetch(`${FRED_API}?${params.toString()}`, {
            next: { revalidate: 86400 }, // Cache for 24 hours
          });

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const upstreamDate = res.headers.get("date");
 
          console.log(`[FRED API] Series: ${seriesId} | Upstream Date: ${upstreamDate}`);

          const data = await res.json();

          const observations =
            data.observations
              ?.map((d) => ({
                date: d.date,
                value: parseFloat(d.value),
              }))
              .filter((d) => !isNaN(d.value)) || [];

          return { seriesId, data: observations, fetchedAt: upstreamDate };
        } catch (err) {
          console.error(`❌ Error fetching ${seriesId}:`, err.message);
          return { seriesId, data: [] };
        }
      })
    );

    return NextResponse.json(results);
  } catch (err) {
    console.error("❌ API route error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}