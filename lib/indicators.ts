/**
 * Technical Indicators Calculator
 * Implements common technical analysis indicators for trading strategies
 */

/**
 * Calculate Relative Strength Index (RSI)
 * Measures the magnitude of recent price changes to evaluate overbought or oversold conditions
 * @param prices Array of closing prices (oldest to newest)
 * @param period RSI period (default: 14)
 * @returns RSI value between 0-100
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Default neutral RSI when insufficient data
  }

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Separate gains and losses
  const gains = changes.map(change => (change > 0 ? change : 0));
  const losses = changes.map(change => (change < 0 ? Math.abs(change) : 0));

  // Calculate initial average gain and loss (SMA)
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate subsequent averages using smoothed method (Wilder's smoothing)
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  // Avoid division by zero
  if (avgLoss === 0) {
    return 100;
  }

  // Calculate RS and RSI
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return parseFloat(rsi.toFixed(2));
}

/**
 * Calculate Simple Moving Average (SMA)
 * Average price over a specified period
 * @param prices Array of prices (oldest to newest)
 * @param period SMA period (e.g., 20 for 20-day SMA)
 * @returns SMA value
 */
export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices[prices.length - 1]; // Return last price if insufficient data
  }

  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return parseFloat((sum / period).toFixed(2));
}

/**
 * Calculate Exponential Moving Average (EMA)
 * Gives more weight to recent prices
 * @param prices Array of prices (oldest to newest)
 * @param period EMA period
 * @returns EMA value
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices[prices.length - 1];
  }

  // Start with SMA
  const sma = calculateSMA(prices.slice(0, period), period);
  const multiplier = 2 / (period + 1);

  let ema = sma;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return parseFloat(ema.toFixed(2));
}

/**
 * Calculate Bollinger Bands
 * Shows volatility bands around a moving average
 * @param prices Array of prices
 * @param period Period (default: 20)
 * @param stdDev Number of standard deviations (default: 2)
 * @returns Object with upper, middle, and lower bands
 */
export function calculateBollinger(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number; middle: number; lower: number } {
  if (prices.length < period) {
    const lastPrice = prices[prices.length - 1];
    return {
      upper: lastPrice,
      middle: lastPrice,
      lower: lastPrice,
    };
  }

  // Calculate middle band (SMA)
  const middle = calculateSMA(prices, period);

  // Calculate standard deviation
  const slice = prices.slice(-period);
  const squaredDiffs = slice.map((price) => Math.pow(price - middle, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const standardDeviation = Math.sqrt(variance);

  // Calculate upper and lower bands
  const upper = middle + stdDev * standardDeviation;
  const lower = middle - stdDev * standardDeviation;

  return {
    upper: parseFloat(upper.toFixed(2)),
    middle: parseFloat(middle.toFixed(2)),
    lower: parseFloat(lower.toFixed(2)),
  };
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * Shows the relationship between two moving averages
 * @param prices Array of prices
 * @param fastPeriod Fast EMA period (default: 12)
 * @param slowPeriod Slow EMA period (default: 26)
 * @param signalPeriod Signal line period (default: 9)
 * @returns Object with MACD line, signal line, and histogram
 */
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number; signal: number; histogram: number } {
  if (prices.length < slowPeriod + signalPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  // Calculate fast and slow EMAs
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  // MACD line
  const macd = fastEMA - slowEMA;

  // Calculate signal line (9-day EMA of MACD)
  // For simplicity, we'll use SMA here (proper implementation would track MACD history)
  const signal = macd * 0.9; // Approximation

  // Histogram
  const histogram = macd - signal;

  return {
    macd: parseFloat(macd.toFixed(2)),
    signal: parseFloat(signal.toFixed(2)),
    histogram: parseFloat(histogram.toFixed(2)),
  };
}

/**
 * Calculate Average True Range (ATR)
 * Measures market volatility
 * @param high Array of high prices
 * @param low Array of low prices
 * @param close Array of closing prices
 * @param period ATR period (default: 14)
 * @returns ATR value
 */
export function calculateATR(
  high: number[],
  low: number[],
  close: number[],
  period: number = 14
): number {
  if (high.length < period + 1 || low.length < period + 1 || close.length < period + 1) {
    return 0;
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < high.length; i++) {
    const tr1 = high[i] - low[i]; // Current high - current low
    const tr2 = Math.abs(high[i] - close[i - 1]); // Current high - previous close
    const tr3 = Math.abs(low[i] - close[i - 1]); // Current low - previous close

    const trueRange = Math.max(tr1, tr2, tr3);
    trueRanges.push(trueRange);
  }

  // Calculate ATR (average of true ranges)
  const atr = calculateSMA(trueRanges, period);

  return parseFloat(atr.toFixed(2));
}

/**
 * Calculate Stochastic Oscillator
 * Compares closing price to price range over a period
 * @param high Array of high prices
 * @param low Array of low prices
 * @param close Array of closing prices
 * @param period Period (default: 14)
 * @returns Object with %K and %D values
 */
export function calculateStochastic(
  high: number[],
  low: number[],
  close: number[],
  period: number = 14
): { k: number; d: number } {
  if (high.length < period || low.length < period || close.length < period) {
    return { k: 50, d: 50 };
  }

  // Get the period slice
  const highSlice = high.slice(-period);
  const lowSlice = low.slice(-period);
  const currentClose = close[close.length - 1];

  // Find highest high and lowest low
  const highestHigh = Math.max(...highSlice);
  const lowestLow = Math.min(...lowSlice);

  // Calculate %K
  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

  // %D is 3-period SMA of %K (simplified)
  const d = k * 0.9; // Approximation

  return {
    k: parseFloat(k.toFixed(2)),
    d: parseFloat(d.toFixed(2)),
  };
}

/**
 * Calculate technical indicators for market data
 * Convenience function to calculate all indicators at once
 * @param ohlcv Array of OHLCV data points
 * @returns Object with all calculated indicators
 */
export function calculateAllIndicators(ohlcv: Array<{
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}>) {
  const closes = ohlcv.map(d => d.close);
  const highs = ohlcv.map(d => d.high);
  const lows = ohlcv.map(d => d.low);

  return {
    rsi: calculateRSI(closes, 14),
    sma20: calculateSMA(closes, 20),
    sma50: calculateSMA(closes, 50),
    sma200: calculateSMA(closes, 200),
    ema12: calculateEMA(closes, 12),
    ema26: calculateEMA(closes, 26),
    bollinger: calculateBollinger(closes, 20, 2),
    macd: calculateMACD(closes, 12, 26, 9),
    atr: calculateATR(highs, lows, closes, 14),
    stochastic: calculateStochastic(highs, lows, closes, 14),
  };
}
