// Simple Technical Indicators Calculation

export const calculateSMA = (data, period) => {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push({ time: data[i].time, value: NaN });
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].value;
    }
    sma.push({ time: data[i].time, value: sum / period });
  }
  return sma.filter(d => !isNaN(d.value));
};

export const calculateEMA = (data, period) => {
  const k = 2 / (period + 1);
  const ema = [];
  let prevEma = data[0].value; // Simple initialization
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema.push({ time: data[i].time, value: data[i].value });
      continue;
    }
    const currentEma = data[i].value * k + prevEma * (1 - k);
    ema.push({ time: data[i].time, value: currentEma });
    prevEma = currentEma;
  }
  return ema;
};

export const calculateBollingerBands = (data, period = 20, stdDevMultiplier = 2) => {
  const bands = { upper: [], lower: [], middle: [] };
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].value;
    }
    const sma = sum / period;
    
    let sumSquaredDiffs = 0;
    for (let j = 0; j < period; j++) {
      sumSquaredDiffs += Math.pow(data[i - j].value - sma, 2);
    }
    const stdDev = Math.sqrt(sumSquaredDiffs / period);
    
    bands.middle.push({ time: data[i].time, value: sma });
    bands.upper.push({ time: data[i].time, value: sma + stdDev * stdDevMultiplier });
    bands.lower.push({ time: data[i].time, value: sma - stdDev * stdDevMultiplier });
  }
  return bands;
};

export const calculateRSI = (data, period = 14) => {
  const rsi = [];
  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = data[i].value - data[i - 1].value;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].value - data[i - 1].value;
    let gain = change > 0 ? change : 0;
    let loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    
    rsi.push({ time: data[i].time, value: rsiValue });
  }
  return rsi;
};

export const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Align arrays
  const macdLine = [];
  // Start from the point where both EMAs exist
  const startIndex = Math.max(fastPeriod, slowPeriod); // Approximation
  
  // Map by time for easier lookup
  const fastMap = new Map(fastEMA.map(d => [d.time, d.value]));
  const slowMap = new Map(slowEMA.map(d => [d.time, d.value]));

  data.forEach(d => {
    const f = fastMap.get(d.time);
    const s = slowMap.get(d.time);
    if (f !== undefined && s !== undefined) {
      macdLine.push({ time: d.time, value: f - s });
    }
  });

  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  const histogram = [];
  const signalMap = new Map(signalLine.map(d => [d.time, d.value]));
  
  macdLine.forEach(d => {
    const s = signalMap.get(d.time);
    if (s !== undefined) {
      histogram.push({ time: d.time, value: d.value - s, color: (d.value - s) >= 0 ? '#22c55e' : '#ef4444' });
    }
  });

  return { macdLine, signalLine, histogram };
};