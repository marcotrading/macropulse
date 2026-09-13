"use client";

import React from "react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatSigned } from "@/lib/data-transforms";
import { BACKTEST } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const TIMINGS = ["Coincident", "Leading", "Lagging"];

const rankColor = (score) => (score >= 66 ? "bg-emerald-500" : score >= 33 ? "bg-amber-400" : "bg-rose-500");

const STATUS_STYLES = {
  triggered: { label: "Triggered", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" },
  watch: { label: "Watch", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  clear: { label: "Clear", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  unavailable: { label: "No data", className: "bg-muted text-muted-foreground" },
};

const TileHeader = ({ title, info }) => (
  <div className="flex items-center gap-1.5">
    <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary transition-colors" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs p-2">
        {info}
      </TooltipContent>
    </Tooltip>
  </div>
);

const Tile = ({ children }) => (
  <Card className="border-muted/60 bg-card/50">
    <CardContent className="p-4 flex flex-col gap-3 h-full">{children}</CardContent>
  </Card>
);

// Timing-group composites; clicking a row filters the cards to that group (clicking it again clears the filter)
export function CycleBreakdownTile({ scores, activeTiming, onSelectTiming }) {
  const coincident = scores.Coincident;

  return (
    <Tile>
      <TileHeader
        title="Cycle breakdown"
        info="Weighted average of 5Y ranks within each timing group, with the composite's weights. Oil and Saving Rate have no timing label and count only in the overall score. Click a row to filter the cards."
      />
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tighter">{coincident === null ? "—" : Math.round(coincident)}</span>
        <span className="text-xs text-muted-foreground">current activity (coincident)</span>
      </div>
      <div className="space-y-1">
        {TIMINGS.map((timing) => {
          const score = scores[timing];
          return (
            <button
              key={timing}
              type="button"
              onClick={() => onSelectTiming(activeTiming === timing ? "All" : timing)}
              className={cn(
                "w-full grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 rounded-md px-1.5 py-1 text-xs text-left transition-colors hover:bg-muted/60",
                activeTiming === timing && "bg-muted"
              )}
            >
              <span className="text-muted-foreground">{timing}</span>
              <span className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <span className={cn("block h-full rounded-full", rankColor(score ?? 0))} style={{ width: `${score ?? 0}%` }} />
              </span>
              <span className="text-right font-medium tabular-nums">{score === null ? "—" : Math.round(score)}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-auto">
        Coincident averaged {BACKTEST.coincident.expansion} in expansions and {BACKTEST.coincident.preRecession} in the year before recessions (2000–2026).
      </p>
    </Tile>
  );
}

export function BreadthTile({ breadth }) {
  const { total, improving, worsening, flat, strong, netImproving } = breadth;
  const share = (count) => `${total ? (count / total) * 100 : 0}%`;
  const netColor =
    netImproving >= BACKTEST.netImproving.expansion
      ? "text-emerald-600 dark:text-emerald-400"
      : netImproving <= BACKTEST.netImproving.preRecession
        ? "text-rose-600 dark:text-rose-400"
        : "text-amber-600 dark:text-amber-400";

  return (
    <Tile>
      <TileHeader
        title="Breadth"
        info="Each composite indicator's 3-month trend, counted as improving or worsening according to whether higher or lower is better. Net improving = improving minus worsening, as a share of all composite indicators."
      />
      <div className="flex items-baseline gap-2">
        <span className={cn("text-3xl font-extrabold tracking-tighter", netColor)}>{formatSigned(netImproving)}%</span>
        <span className="text-xs text-muted-foreground">net improving</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/50">
          <span className="bg-emerald-500" style={{ width: share(improving) }} />
          <span className="bg-slate-300 dark:bg-slate-600" style={{ width: share(flat) }} />
          <span className="bg-rose-500" style={{ width: share(worsening) }} />
        </div>
        <div className="flex flex-wrap justify-between gap-x-3 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400">{improving} improving</span>
          <span className="text-muted-foreground">{flat} flat</span>
          <span className="text-rose-600 dark:text-rose-400">{worsening} worsening</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {strong} of {total} ranked 50 or more
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground mt-auto">
        Net improving averaged {formatSigned(BACKTEST.netImproving.expansion)}% in expansions and {formatSigned(BACKTEST.netImproving.preRecession)}% in the year before recessions (2000–2026).
      </p>
    </Tile>
  );
}

export function AlertsTile({ alerts }) {
  return (
    <Tile>
      <TileHeader
        title="Recession alerts"
        info="Fixed-threshold rules with long track records. They are shown alongside the composite and do not affect it. Hover a rule name for its definition."
      />
      <ul className="space-y-2.5">
        {alerts.map((alert) => {
          const style = STATUS_STYLES[alert.status];
          return (
            <li key={alert.id} className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium cursor-help">{alert.name}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs p-2">
                    {alert.rule}
                  </TooltipContent>
                </Tooltip>
                <span className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground">{alert.valueText}</span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide", style.className)}>
                    {style.label}
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{alert.history}</p>
            </li>
          );
        })}
      </ul>
    </Tile>
  );
}
