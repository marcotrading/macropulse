export const INDICATORS = [
  { id: "GDPC1", frequency: "Q", scoreBasis: "yoy", name: "Real GDP", narrative: "Real Gross Domestic Product", weight: 3, category: "Growth & Output", timing: "Coincident", description: "Inflation-adjusted value of goods and services produced in the US (chained 2017 dollars). The primary measure of economic growth." },
  { id: "RRSFS", frequency: "M", scoreBasis: "yoy", name: "Real Retail Sales", narrative: "Real Retail and Food Services Sales", weight: 2, category: "Growth & Output", timing: "Coincident", description: "Retail and food services sales, adjusted for inflation with the CPI by the Census Bureau. A key gauge of real consumer spending." },
  { id: "INDPRO", frequency: "M", scoreBasis: "yoy", name: "Ind. Production", narrative: "Industrial Production Index", weight: 2, category: "Growth & Output", timing: "Coincident", description: "Real output of all manufacturing, mining, and electric/gas utility facilities." },
  { id: "HOUST", frequency: "M", name: "Housing Starts", narrative: "Housing Starts", weight: 1, category: "Growth & Output", timing: "Leading", description: "Number of new residential construction projects that have begun. Highly sensitive to rates." },
  { id: "CSUSHPINSA", frequency: "M", scoreBasis: "yoy", name: "Home Prices", narrative: "Case-Shiller Home Price Index", weight: 2, category: "Growth & Output", timing: "Lagging", description: "The leading measure of US residential real estate prices (National Index)." },
  { id: "BOPGSTB", frequency: "M", name: "Trade Balance", narrative: "Trade Balance (Goods & Services)", weight: 0, category: "Growth & Output", timing: "Coincident", description: "Difference between the value of US exports and imports. A deficit means imports exceed exports." },
  { id: "DCOILWTICO", frequency: "D", name: "Oil", narrative: "Crude Oil Prices WTI", weight: 1, category: "Growth & Output", timing: null, description: "Price per barrel of West Texas Intermediate crude. A key driver of headline inflation." },
  { id: "PSAVERT", frequency: "M", name: "Saving Rate", narrative: "Personal Saving Rate", weight: 1, category: "Growth & Output", timing: null, description: "Personal saving as a percentage of disposable personal income. Indicates consumer financial health." },
  { id: "DGORDER", deflator: "WPSFD4131", frequency: "M", scoreBasis: "yoy", name: "Durable Goods (real)", narrative: "Durable Goods Orders, inflation-adjusted", weight: 2, category: "Growth & Output", timing: "Leading", description: "New orders for factory hard goods (lasting 3+ years), adjusted for inflation with the PPI for finished goods less food and energy (WPSFD4131)." },
  { id: "TCU", frequency: "M", name: "Capacity Util.", narrative: "Capacity Utilization Rate", weight: 1, category: "Growth & Output", timing: "Coincident", description: "The percentage of the economy's aggregate production capacity that is actually being used." },
  { id: "TDSP", frequency: "Q", name: "HH Debt Service", narrative: "Household Debt Service Ratio", weight: 1, category: "Growth & Output", timing: "Lagging", description: "Total required household debt payments as a percent of disposable personal income." },


  { id: "UNRATE", frequency: "M", name: "Unemployment", narrative: "Unemployment Rate %", weight: 3, category: "Labor Market", timing: "Lagging", description: "Percentage of the total labor force that is unemployed and actively looking for a job." },
  { id: "PAYEMS", frequency: "M", scoreBasis: "yoy", name: "Payrolls", narrative: "Nonfarm Payrolls", weight: 3, category: "Labor Market", timing: "Coincident", description: "Number of paid workers in the US excluding farm, private household, and non-profit employees." },
  { id: "ICSA", frequency: "W", name: "Jobless Claims", narrative: "Initial Jobless Claims", weight: 2, category: "Labor Market", timing: "Leading", description: "Number of individuals who filed for unemployment insurance for the first time. A leading indicator." },
  { id: "CIVPART", frequency: "M", name: "Labor Part. Rate", narrative: "Labor Force Participation Rate", weight: 2, category: "Labor Market", timing: "Lagging", description: "Percentage of the civilian noninstitutional population that is in the labor force." },
  { id: "JTSJOL", frequency: "M", name: "Job Openings", narrative: "JOLTS Job Openings", weight: 2, category: "Labor Market", timing: "Leading", description: "Number of job openings on the last business day of the month. Measures labor demand." },

  { id: "CPIAUCSL", frequency: "M", scoreBasis: "yoy", name: "CPI", narrative: "Consumer Price Index", weight: 3, category: "Inflation & Prices", timing: "Lagging", description: "Measure of the average change over time in prices paid by urban consumers for a market basket of consumer goods." },
  { id: "PPIACO", frequency: "M", scoreBasis: "yoy", name: "PPI", narrative: "Producer Price Index", weight: 2, category: "Inflation & Prices", timing: "Coincident", description: "Measure of the average change over time in the selling prices received by domestic producers." },
  { id: "FEDFUNDS", frequency: "M", name: "Fed Funds Rate", narrative: "Effective Federal Funds Rate", weight: 3, category: "Inflation & Prices", timing: "Lagging", description: "The interest rate at which depository institutions trade federal funds (balances held at Federal Reserve Banks) overnight." },
  { id: "M2REAL", frequency: "M", scoreBasis: "yoy", name: "Real M2", narrative: "Real M2 Money Stock", weight: 1, category: "Inflation & Prices", timing: "Leading", description: "M2 money supply (cash, checking and savings deposits, money market funds) deflated by the CPI." },

  { id: "UMCSENT", frequency: "M", name: "Sentiment", narrative: "Consumer Sentiment", weight: 1, category: "Sentiment & Markets", timing: "Leading", description: "University of Michigan survey of consumer confidence regarding personal finances and business conditions." },
  { id: "VIXCLS", frequency: "D", name: "VIX", narrative: "CBOE Volatility Index", weight: 2, category: "Sentiment & Markets", timing: "Leading", description: "A real-time index that represents the market's expectations for volatility over the coming 30 days." },
  { id: "DGS10", frequency: "D", name: "10Y Yield", narrative: "10-Year Treasury Yield", weight: 0, category: "Sentiment & Markets", timing: "Leading", description: "The yield on the 10-year US Treasury note. A benchmark for mortgage rates and long-term borrowing costs." },
  { id: "DGS2", frequency: "D", name: "2Y Yield", narrative: "2-Year Treasury Yield", weight: 0, category: "Sentiment & Markets", timing: "Leading", description: "The yield on the 2-year US Treasury note. Highly sensitive to Fed policy expectations." },
  { id: "T10Y2Y", frequency: "D", name: "10Y–2Y Spread", narrative: "10-Year minus 2-Year Treasury Spread", weight: 2, category: "Sentiment & Markets", timing: "Leading", description: "Long minus short Treasury yield. An inversion (below zero) has preceded every US recession since 1980; the curve usually re-steepens just before the downturn starts." },
];

export const INDICATOR_BEHAVIOR = {
  GDPC1: "higher_is_better",
  PAYEMS: "higher_is_better",
  RRSFS: "higher_is_better",
  UMCSENT: "higher_is_better",
  HOUST: "higher_is_better",
  INDPRO: "higher_is_better",
  CSUSHPINSA: "higher_is_better",
  BOPGSTB: "higher_is_better", // Smaller deficit is better; weight 0 keeps it out of the composite (cyclically the deficit narrows in recessions)
  PSAVERT: "higher_is_better",
  DGORDER: "higher_is_better",
  TCU: "higher_is_better",
  CPIAUCSL: "lower_is_better",
  UNRATE: "lower_is_better",
  ICSA: "lower_is_better",
  PPIACO: "lower_is_better",
  DGS10: "lower_is_better", // weight 0: yields also fall ahead of recessions, so the level is ambiguous; T10Y2Y carries the rates signal
  DGS2: "lower_is_better", // weight 0, see DGS10
  T10Y2Y: "higher_is_better", // Percentile of the current spread; does not flag a recent inversion that has re-steepened
  FEDFUNDS: "lower_is_better", // Context dependent, but usually ease is better for markets
  M2REAL: "higher_is_better", // Scored on real YoY growth: more liquidity supports future activity
  DCOILWTICO: "lower_is_better",
  VIXCLS: "lower_is_better",
  CIVPART: "higher_is_better",
  JTSJOL: "higher_is_better",
  TDSP: "lower_is_better",
};
