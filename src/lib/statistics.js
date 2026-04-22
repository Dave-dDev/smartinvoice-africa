/**
 * Statistical Analysis Utilities for SmartInvoice Africa
 * Provides comprehensive statistical functions for financial data analysis
 */

/**
 * Calculate basic descriptive statistics for an array of numbers
 * @param {number[]} data - Array of numeric values
 * @returns {Object} Statistical measures
 */
export function descriptiveStats(data) {
  if (!data || data.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      mode: [],
      stdDev: 0,
      variance: 0,
      min: 0,
      max: 0,
      range: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
    };
  }

  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  
  // Mean
  const mean = data.reduce((a, b) => a + b, 0) / n;
  
  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  
  // Mode
  const frequency = {};
  data.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
  });
  const maxFreq = Math.max(...Object.values(frequency));
  const mode = Object.keys(frequency)
    .filter(key => frequency[key] === maxFreq && maxFreq > 1)
    .map(Number);
  
  // Variance and Standard Deviation
  const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(variance);
  
  // Min, Max, Range
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;
  
  // Quartiles
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  return {
    count: n,
    mean,
    median,
    mode,
    stdDev,
    variance,
    min,
    max,
    range,
    q1,
    q3,
    iqr,
  };
}

/**
 * Calculate growth rate between two periods
 * @param {number} current - Current period value
 * @param {number} previous - Previous period value
 * @returns {number} Growth rate as percentage
 */
export function growthRate(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate moving average for time series data
 * @param {number[]} data - Array of values
 * @param {number} window - Window size for moving average
 * @returns {number[]} Moving averages
 */
export function movingAverage(data, window = 3) {
  if (data.length < window) return data;
  
  const result = [];
  for (let i = window - 1; i < data.length; i++) {
    const slice = data.slice(i - window + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / window;
    result.push(avg);
  }
  return result;
}

/**
 * Calculate correlation coefficient between two datasets
 * @param {number[]} x - First dataset
 * @param {number[]} y - Second dataset
 * @returns {number} Pearson correlation coefficient (-1 to 1)
 */
export function correlation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }
  
  const denominator = Math.sqrt(sumX2 * sumY2);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate profit margin
 * @param {number} revenue - Total revenue
 * @param {number} expenses - Total expenses
 * @returns {number} Profit margin percentage
 */
export function profitMargin(revenue, expenses) {
  if (revenue === 0) return 0;
  return ((revenue - expenses) / revenue) * 100;
}

/**
 * Identify outliers using IQR method
 * @param {number[]} data - Array of values
 * @returns {Object} Outlier information
 */
export function detectOutliers(data) {
  const stats = descriptiveStats(data);
  const lowerBound = stats.q1 - 1.5 * stats.iqr;
  const upperBound = stats.q3 + 1.5 * stats.iqr;
  
  const outliers = data.filter(val => val < lowerBound || val > upperBound);
  const normalValues = data.filter(val => val >= lowerBound && val <= upperBound);
  
  return {
    outliers,
    normalValues,
    lowerBound,
    upperBound,
    hasOutliers: outliers.length > 0,
  };
}

/**
 * Calculate trend direction and strength
 * @param {number[]} data - Time series data
 * @returns {Object} Trend analysis
 */
export function analyzeTrend(data) {
  if (data.length < 2) return { direction: 'stable', strength: 0, change: 0 };
  
  const changes = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }
  
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  const positiveChanges = changes.filter(c => c > 0).length;
  const negativeChanges = changes.filter(c => c < 0).length;
  
  const direction = avgChange > 0 ? 'increasing' : avgChange < 0 ? 'decreasing' : 'stable';
  const strength = Math.abs(avgChange) / (data.reduce((a, b) => a + b, 0) / data.length) * 100;
  
  return {
    direction,
    strength,
    change: avgChange,
    positivePeriods: positiveChanges,
    negativePeriods: negativeChanges,
  };
}

/**
 * Calculate year-over-year or period-over-period comparison
 * @param {number[]} current - Current period data
 * @param {number[]} previous - Previous period data
 * @returns {Object} Comparison metrics
 */
export function periodComparison(current, previous) {
  if (!current || !previous || current.length !== previous.length) {
    return { growthRates: [], avgGrowth: 0 };
  }
  
  const growthRates = current.map((val, i) => growthRate(val, previous[i]));
  const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  
  return {
    growthRates,
    avgGrowth,
    bestGrowth: Math.max(...growthRates),
    worstGrowth: Math.min(...growthRates),
  };
}

/**
 * Calculate expense category distribution
 * @param {Array} expenses - Array of expense objects with category and amount
 * @returns {Object} Category distribution analysis
 */
export function categoryDistribution(expenses) {
  const categoryTotals = {};
  const categoryCounts = {};
  
  expenses.forEach(exp => {
    const cat = exp.category;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  
  const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const distribution = {};
  
  Object.keys(categoryTotals).forEach(cat => {
    distribution[cat] = {
      total: categoryTotals[cat],
      count: categoryCounts[cat],
      percentage: total > 0 ? (categoryTotals[cat] / total) * 100 : 0,
      average: categoryCounts[cat] > 0 ? categoryTotals[cat] / categoryCounts[cat] : 0,
    };
  });
  
  return {
    distribution,
    total,
    categoryCount: Object.keys(categoryTotals).length,
  };
}

/**
 * Calculate invoice payment statistics
 * @param {Array} invoices - Array of invoice objects with status and amount
 * @returns {Object} Invoice statistics
 */
export function invoiceStats(invoices) {
  const total = invoices.length;
  const paid = invoices.filter(i => i.status === 'paid');
  const overdue = invoices.filter(i => i.status === 'overdue');
  const pending = invoices.filter(i => ['sent', 'viewed'].includes(i.status));
  
  const paidRate = total > 0 ? (paid.length / total) * 100 : 0;
  const overdueRate = total > 0 ? (overdue.length / total) * 100 : 0;
  
  const totalAmount = invoices.reduce((a, b) => a + b.amount, 0);
  const paidAmount = paid.reduce((a, b) => a + b.amount, 0);
  const overdueAmount = overdue.reduce((a, b) => a + b.amount, 0);
  
  return {
    total,
    paid: paid.length,
    overdue: overdue.length,
    pending: pending.length,
    paidRate,
    overdueRate,
    totalAmount,
    paidAmount,
    overdueAmount,
    collectionRatio: totalAmount > 0 ? paidAmount / totalAmount : 0,
  };
}
