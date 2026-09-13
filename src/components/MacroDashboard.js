"use client";

import React, { useState, useEffect } from "react";
import { INDICATORS, INDICATOR_BEHAVIOR } from "@/lib/indicators";
import { calculateYoY, formatObservationDate } from "@/lib/data-transforms";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUp, ArrowDown, ArrowRight, Info, Search, Activity } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import IndicatorDetail from "./IndicatorDetail";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

// --- Utility Components ---

const TrendArrow = ({ trend, id, className }) => {
  const behavior = INDICATOR_BEHAVIOR[id] || "higher_is_better";
  const isUpGood = behavior === "higher_is_better";

  if (trend === "up") return <ArrowUp className={cn(isUpGood ? "text-green-500" : "text-red-500", className)} />;
  if (trend === "down") return <ArrowDown className={cn(isUpGood ? "text-red-500" : "text-green-500", className)} />;
  return <ArrowRight className={cn("text-muted-foreground", className)} />;
};

// A minimal sparkline chart
const Sparkline = ({ data, color = "#3b82f6" }) => (
  <div className="h-full w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// New cleaner Indicator Card
const IndicatorCard = ({ indicator, onClick }) => {
  // Determine trend color for sparkline
  const behavior = INDICATOR_BEHAVIOR[indicator.id] || "higher_is_better";
  const isUpGood = behavior === "higher_is_better";
  const latest = indicator.history.at(-1);
  const isYoY = indicator.scoreBasis === "yoy";
  let trendColor = "#94a3b8"; // gray-400
  if (indicator.trend === "up") trendColor = isUpGood ? "#22c55e" : "#ef4444";
  if (indicator.trend === "down") trendColor = isUpGood ? "#ef4444" : "#22c55e";

  return (
    <Card
      onClick={onClick}
      className="group relative overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer border-muted/60 bg-card/50 hover:bg-card"
    >
      <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
             <div className="flex items-center gap-1.5">
                <span className="font-semibold text-base tracking-tight">{indicator.name}</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-sm p-2">
                        {indicator.description}
                    </TooltipContent>
                </Tooltip>
             </div>
             <span className="text-xs text-muted-foreground truncate max-w-[140px]">{indicator.narrative}</span>
          </div>

          {indicator.timing && (
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase",
                indicator.timing === "Leading" && "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
                indicator.timing === "Lagging" && "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
                indicator.timing === "Coincident" && "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"
              )}
            >
              {indicator.timing}
            </span>
          )}
        </div>

        {/* Main Value Area */}
        <div className="flex items-end justify-between mt-1">
            <div>
                <div className="text-2xl font-bold tracking-tight">
                    {latest ? `${latest.value}${isYoY ? "%" : ""}` : "—"}
                </div>
                <div className="text-[11px] text-muted-foreground/70">
                    {latest ? `${isYoY ? "YoY · " : ""}${formatObservationDate(latest.date, indicator.frequency)}` : ""}
                </div>
            </div>
            
            {/* Sparkline & Trend */}
            <div className="flex items-center gap-3">
                 <div className="w-16 h-8 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Sparkline data={indicator.history} color={trendColor} />
                 </div>
                 <TrendArrow trend={indicator.trend} id={indicator.id} className="w-5 h-5" />
            </div>
        </div>

        {/* Footer: Strength Meter (Slim Line) */}
        <div className="mt-1 space-y-1">
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wider">
                <span>Strength{indicator.weight === 0 ? " · not in composite" : ""}</span>
                <span>{Math.round(indicator.score)}/100</span>
            </div>
            <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        indicator.score >= 66 ? "bg-emerald-500" :
                        indicator.score >= 33 ? "bg-amber-400" : "bg-rose-500"
                    )}
                    style={{ width: `${indicator.score}%` }}
                />
            </div>
        </div>
      </CardContent>
    </Card>
  );
};


// Calculate a 0-100 score based on percentile rank over historical data
const calculateScore = (id, history) => {
  if (history.length < 2) return 50; // Default score if not enough data

  const behavior = INDICATOR_BEHAVIOR[id] || "higher_is_better";
  const latestValue = history.at(-1).value;

  // Sort historical values to find rank
  const sortedHistory = [...history].map((h) => h.value).sort((a, b) => a - b);
  const rank = sortedHistory.indexOf(latestValue) + 1;

  // Calculate percentile
  const percentile = (rank / sortedHistory.length) * 100;

  // Invert score for indicators where lower is better
  if (behavior === "lower_is_better") {
    return 100 - percentile;
  }

  return percentile;
};


export default function MacroDashboard() {
  const [indicators, setIndicators] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filterTiming, setFilterTiming] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalBrushState, setGlobalBrushState] = useState({ startDate: null, endDate: null });

  useEffect(() => {
    async function load() {
      try {
        const ids = INDICATORS.map((i) => i.id).join(",");
        console.log("📡 Fetching indicators:", ids);

        // Score over the last 5 years; fetch 6 so YoY values cover the whole window
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        const scoringStart = fiveYearsAgo.toISOString().split("T")[0];

        const sixYearsAgo = new Date();
        sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
        const observation_start = sixYearsAgo.toISOString().split("T")[0];

        const res = await axios.get(
          `/api/fred?series_id=${ids}&observation_start=${observation_start}`
        );

        if (!Array.isArray(res.data) || !res.data.length) {
          setError("No data available. Please check API key and network.");
          return;
        }

        const mapped = INDICATORS.map((meta) => {
          const found = res.data.find((r) => r.seriesId === meta.id);
          const rawHistory = found?.data || [];
          // Trending series (output, payrolls, price levels, M2) sit at a 5-year extreme as levels, so score their YoY % change
          const series = meta.scoreBasis === "yoy" ? calculateYoY(rawHistory) : rawHistory;
          const fullHistory = series.filter((d) => d.date >= scoringStart);

          if (fullHistory.length < 2) {
            return {
              ...meta,
              history: [],
              score: 50, // Default score
              trend: "right",
            };
          }

          const latest = fullHistory.at(-1).value;
          const prev = fullHistory.at(-2).value;

          // Chart shows last 12 points, score uses full history
          const chartHistory = fullHistory.slice(-12);

          return {
            ...meta,
            history: chartHistory,
            score: calculateScore(meta.id, fullHistory),
            trend: latest > prev ? "up" : latest < prev ? "down" : "right",
          };
        });

        setIndicators(mapped);
      } catch (err) {
        console.error("❌ Dashboard load error:", err.message);
        setError("Failed to load data.");
      }
    }
    load();
  }, []);

  if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
  if (!indicators) return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
          <Activity className="animate-spin h-8 w-8 text-primary" />
          <span className="text-muted-foreground animate-pulse">Loading MacroPulse...</span>
      </div>
  );

  // weight 0 excludes an indicator from the composite; only a missing weight defaults to 1
  const totalWeightedScore = indicators.reduce((sum, i) => sum + i.score * (i.weight ?? 1), 0);
  const totalWeight = indicators.reduce((sum, i) => sum + (i.weight ?? 1), 0);
  const compositeCount = indicators.filter((i) => (i.weight ?? 1) > 0).length;
  const composite = Math.round(totalWeightedScore / totalWeight);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-12">
        {/* Header Section */}
        <header className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-md">
                    <Activity className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">MacroPulse</h1>
            </div>
            <div className="flex items-center gap-4">
                 {/* Mini Score for Mobile/Sticky Context - Hidden on large screens if we have a Hero */}
                <div className="hidden md:flex flex-col items-end mr-4">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">US Economic Health</span>
                    <span className={cn("text-sm font-bold", composite >= 66 ? "text-emerald-600" : composite >= 33 ? "text-amber-600" : "text-rose-600")}>
                        {composite}/100
                    </span>
                </div>
                <ModeToggle />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-10">
            
            {/* Hero: Composite Score & Search/Filter */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                
                {/* Composite Score Hero Card */}
                <div className="md:col-span-4 lg:col-span-3">
                     <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/50 overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center py-10">
                             <div className="relative flex items-center justify-center w-32 h-32">
                                 {/* Simple SVG Ring for score */}
                                 <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                     <circle className="text-muted/20" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                     <circle 
                                        className={cn("transition-all duration-1000 ease-out", 
                                            composite >= 66 ? "text-emerald-500" : composite >= 33 ? "text-amber-500" : "text-rose-500"
                                        )} 
                                        strokeWidth="8" 
                                        strokeLinecap="round" 
                                        strokeDasharray={251.2} 
                                        strokeDashoffset={251.2 - (251.2 * composite) / 100} 
                                        stroke="currentColor" 
                                        fill="transparent" 
                                        r="40" cx="50" cy="50" 
                                     />
                                 </svg>
                                 <div className="absolute flex flex-col items-center">
                                     <span className="text-3xl font-extrabold tracking-tighter">{composite}</span>
                                     <span className="text-[10px] uppercase font-bold text-muted-foreground">Score</span>
                                 </div>
                             </div>
                             
                             <div className="mt-4 space-y-1">
                                <h2 className="text-lg font-semibold">
                                    {composite >= 66 ? "Strong Expansion" : composite >= 33 ? "Moderate Growth" : "Contraction Risk"}
                                </h2>
                                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                                    Weighted aggregate of {compositeCount} key economic indicators.
                                </p>
                             </div>
                        </CardContent>
                     </Card>
                </div>

                {/* Controls */}
                <div className="md:col-span-8 lg:col-span-9 space-y-6">
                    <div className="flex flex-col gap-2">
                         <h2 className="text-2xl font-bold tracking-tight text-foreground/90">Economic Indicators</h2>
                         <p className="text-muted-foreground max-w-2xl">
                            Track real-time data from the Federal Reserve. Filter by timing to see leading signals or search for specific metrics.
                         </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-2 rounded-xl border">
                         {/* Segmented Control for Filters */}
                         <div className="flex p-1 bg-muted rounded-lg overflow-x-auto w-full sm:w-auto no-scrollbar">
                            {['All', 'Leading', 'Coincident', 'Lagging'].map(timingType => (
                                <button
                                    key={timingType}
                                    onClick={() => setFilterTiming(timingType)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                        filterTiming === timingType
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    )}
                                >
                                    {timingType}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search metrics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>
                </div>
            </section>

          {/* Indicators Grid */}
          <div className="space-y-10">
            {["Growth & Output", "Labor Market", "Inflation & Prices", "Sentiment & Markets"].map((cat) => {
                const catIndicators = indicators.filter((i) => 
                    i.category === cat && 
                    (filterTiming === 'All' || i.timing === filterTiming) &&
                    (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     i.narrative.toLowerCase().includes(searchQuery.toLowerCase()))
                );
                
                if (catIndicators.length === 0) return null;

                return (
                  <section key={cat} className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                        <h3 className="text-lg font-bold text-foreground/80">{cat}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {catIndicators.map((pillar) => (
                        <IndicatorCard 
                            key={pillar.name} 
                            indicator={pillar} 
                            onClick={() => setSelected(pillar)} 
                        />
                      ))}
                    </div>
                  </section>
                );
            })}
            
             {indicators.filter(i => 
                  (filterTiming === 'All' || i.timing === filterTiming) &&
                  (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   i.narrative.toLowerCase().includes(searchQuery.toLowerCase()))
              ).length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <p>No indicators found matching your criteria.</p>
                    <button 
                        onClick={() => {setFilterTiming('All'); setSearchQuery('');}}
                        className="mt-2 text-primary hover:underline"
                    >
                        Clear filters
                    </button>
                </div>
              )}

          </div>
        </main>
        
        <IndicatorDetail 
            indicator={selected} 
            onClose={() => setSelected(null)} 
            globalBrushState={globalBrushState}
            setGlobalBrushState={setGlobalBrushState}
        />
      </div>
    </TooltipProvider>
  );
}
