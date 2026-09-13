"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Brush,
  ReferenceArea,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@radix-ui/react-label";
import { INDICATORS } from "@/lib/indicators";
import { calculateYoY, formatObservationDate } from "@/lib/data-transforms";

export default function IndicatorDetail({ indicator, onClose, globalBrushState, setGlobalBrushState }) {
  const [history, setHistory] = useState([]);
  const [usrecHistory, setUsrecHistory] = useState([]);
  const [recessionPeriods, setRecessionPeriods] = useState([]);
  const [comparisonIndicatorId, setComparisonIndicatorId] = useState(null); // New state for comparison indicator ID
  const [comparisonHistory, setComparisonHistory] = useState([]); // New state for comparison indicator's data
  const [displayYoY, setDisplayYoY] = useState(false); // New state for YoY display toggle

  useEffect(() => {
    if (!indicator) {
      setHistory([]);
      setUsrecHistory([]);
      setRecessionPeriods([]);
      setComparisonHistory([]);
      return;
    }

    async function fetchAllData() {
      try {
        let seriesToFetch = `${indicator.id},USREC`;
        if (comparisonIndicatorId) {
          seriesToFetch += `,${comparisonIndicatorId}`;
        }

        // Fetch 10 years of history, by date so mixed-frequency series share one range
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        const observation_start = tenYearsAgo.toISOString().split("T")[0];

        const res = await axios.get(
          `/api/fred?series_id=${seriesToFetch}&observation_start=${observation_start}`
        );

        const mainIndicatorData = res.data.find((d) => d.seriesId === indicator.id)?.data || [];
        const usrecData = res.data.find((d) => d.seriesId === "USREC")?.data || [];
        const compIndicatorData = res.data.find((d) => d.seriesId === comparisonIndicatorId)?.data || [];

        setHistory(mainIndicatorData);
        setUsrecHistory(usrecData);
        setComparisonHistory(compIndicatorData); // Set comparison history

      } catch (err) {
        console.error("Error fetching extended history:", err.message);
        setHistory([]);
        setUsrecHistory([]);
        setRecessionPeriods([]);
        setComparisonHistory([]); // Reset comparison history on error
      }
    }

    fetchAllData();
  }, [indicator, comparisonIndicatorId]); // Add comparisonIndicatorId to dependencies

  useEffect(() => {
    if (usrecHistory.length > 0) {
      const periods = [];
      let recessionStart = null;

      usrecHistory.forEach((d, index) => {
        // FRED USREC: 1 = recession, 0 = non-recession
        if (d.value === 1 && recessionStart === null) {
          recessionStart = d.date;
        } else if (d.value === 0 && recessionStart !== null) {
          // End of recession period
          periods.push({ x1: recessionStart, x2: usrecHistory[index - 1].date });
          recessionStart = null;
        }
      });

      // If recession is ongoing at the end of the fetched data
      if (recessionStart !== null) {
        periods.push({ x1: recessionStart, x2: usrecHistory.at(-1).date });
      }
      setRecessionPeriods(periods);
    } else {
      setRecessionPeriods([]);
    }
  }, [usrecHistory]);

  const frequency = indicator?.frequency;
  const formatDate = useCallback((tickItem) => formatObservationDate(tickItem, frequency, true), [frequency]);
  const formatTooltipDate = useCallback((label) => formatObservationDate(label, frequency), [frequency]);

  const mergedData = useMemo(() => {
    const main = displayYoY ? calculateYoY(history) : history;
    const comp = displayYoY ? calculateYoY(comparisonHistory) : comparisonHistory;

    if (!comparisonIndicatorId || comp.length === 0) {
      return main;
    }

    // Create a map for fast lookup of comparison values by date
    const compMap = new Map(comp.map((item) => [item.date, item.value]));

    return main.map((item) => ({
      ...item,
      comparisonValue: compMap.get(item.date),
    }));
  }, [history, comparisonHistory, displayYoY, comparisonIndicatorId]);

  // Calculate brush indices based on dates
  const brushIndices = useMemo(() => {
      if (!globalBrushState?.startDate || !globalBrushState?.endDate || mergedData.length === 0) {
          return {};
      }
      
      const startIndex = mergedData.findIndex(d => d.date >= globalBrushState.startDate);
      let endIndex = mergedData.findIndex(d => d.date >= globalBrushState.endDate);
      
      // If exact end date not found, find closest or last
      if (endIndex === -1 && globalBrushState.endDate >= mergedData.at(-1).date) {
         endIndex = mergedData.length - 1;
      }

      return {
          startIndex: startIndex >= 0 ? startIndex : undefined,
          endIndex: endIndex >= 0 ? endIndex : undefined
      };
  }, [mergedData, globalBrushState]);

  return (
    <Dialog open={!!indicator} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>
                {indicator?.name} — {indicator?.narrative}
              </DialogTitle>
              <DialogDescription>{indicator?.description}</DialogDescription>
            </div>
            <div className="flex items-center gap-4 pr-8"> {/* New container for controls */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="yoy-mode"
                  checked={displayYoY}
                  onCheckedChange={setDisplayYoY}
                />
                <Label htmlFor="yoy-mode">YoY % Change</Label>
              </div>
                          <Select
                            value={comparisonIndicatorId || "none"}
                            onValueChange={(value) => setComparisonIndicatorId(value === "none" ? null : value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Compare with..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {Object.entries(
                                INDICATORS.filter((i) => i.id !== indicator?.id).reduce((acc, curr) => {
                                  const category = curr.category || "Other";
                                  if (!acc[category]) acc[category] = [];
                                  acc[category].push(curr);
                                  return acc;
                                }, {})
                              ).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, indicators]) => (
                                <React.Fragment key={category}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                                    {category}
                                  </div>
                                  {indicators.sort((a, b) => a.name.localeCompare(b.name)).map((i) => (
                                    <SelectItem key={i.id} value={i.id}>
                                      {i.name}
                                    </SelectItem>
                                  ))}
                                </React.Fragment>
                              ))}
                            </SelectContent>
                          </Select>            </div>
          </div>
        </DialogHeader>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart key={displayYoY ? 'yoy' : 'raw'} data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis yAxisId="left" domain={['auto', 'auto']} />
              {comparisonHistory.length > 0 && (
                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} stroke="#8884d8" />
              )}
              <Tooltip labelFormatter={formatTooltipDate} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              {comparisonHistory.length > 0 && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="comparisonValue"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}
              <Brush
                dataKey="date"
                tickFormatter={formatDate}
                height={30}
                stroke="#8884d8"
                startIndex={brushIndices.startIndex}
                endIndex={brushIndices.endIndex}
                onChange={(e) => {
                   if (e.startIndex !== undefined && e.endIndex !== undefined && setGlobalBrushState && mergedData[e.startIndex] && mergedData[e.endIndex]) {
                       setGlobalBrushState({ 
                           startDate: mergedData[e.startIndex].date, 
                           endDate: mergedData[e.endIndex].date 
                       });
                   }
                }}
              />
              {recessionPeriods.map((period, index) => (
                <ReferenceArea
                  key={`recession-${index}`}
                  x1={period.x1}
                  x2={period.x2}
                  strokeOpacity={0.3}
                  fill="#d6d6d6" // Light gray fill
                  yAxisId="left" // Default Y-axis
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
