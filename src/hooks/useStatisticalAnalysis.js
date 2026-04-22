import { useMemo } from "react";
import {
  descriptiveStats,
  growthRate,
  movingAverage,
  correlation,
  profitMargin,
  detectOutliers,
  analyzeTrend,
  periodComparison,
  categoryDistribution,
  invoiceStats,
} from "../lib/statistics";

/**
 * Hook for computing statistical analysis on financial data
 * @param {Array} invoices - Array of invoice data
 * @param {Array} expenses - Array of expense data
 * @param {number[]} revenueData - Monthly revenue array
 * @param {number[]} expenseData - Monthly expense array
 * @returns {Object} Comprehensive statistical analysis
 */
export function useStatisticalAnalysis(invoices = [], expenses = [], revenueData = [], expenseData = []) {
  
  // Invoice statistics
  const invoiceAnalysis = useMemo(() => {
    const amounts = invoices.map(i => i.amount);
    const stats = descriptiveStats(amounts);
    const payment = invoiceStats(invoices);
    
    return {
      ...stats,
      ...payment,
      averageInvoice: stats.mean,
      typicalInvoice: stats.median,
    };
  }, [invoices]);
  
  // Expense statistics
  const expenseAnalysis = useMemo(() => {
    const amounts = expenses.map(e => e.amount);
    const stats = descriptiveStats(amounts);
    const byCategory = categoryDistribution(expenses);
    const outliers = detectOutliers(amounts);
    
    return {
      ...stats,
      byCategory,
      outliers,
      averageExpense: stats.mean,
      typicalExpense: stats.median,
    };
  }, [expenses]);
  
  // Revenue trend analysis
  const revenueTrend = useMemo(() => {
    const trend = analyzeTrend(revenueData);
    const movingAvg = movingAverage(revenueData, 3);
    return {
      ...trend,
      movingAverage: movingAvg,
      latest: revenueData[revenueData.length - 1] || 0,
      previous: revenueData[revenueData.length - 2] || 0,
      growth: revenueData.length >= 2 ? 
        growthRate(revenueData[revenueData.length - 1], revenueData[revenueData.length - 2]) : 0,
    };
  }, [revenueData]);
  
  // Expense trend analysis
  const expenseTrend = useMemo(() => {
    const trend = analyzeTrend(expenseData);
    const movingAvg = movingAverage(expenseData, 3);
    return {
      ...trend,
      movingAverage: movingAvg,
      latest: expenseData[expenseData.length - 1] || 0,
      previous: expenseData[expenseData.length - 2] || 0,
      growth: expenseData.length >= 2 ? 
        growthRate(expenseData[expenseData.length - 1], expenseData[expenseData.length - 2]) : 0,
    };
  }, [expenseData]);
  
  // Profitability analysis
  const profitability = useMemo(() => {
    const totalRevenue = revenueData.reduce((a, b) => a + b, 0);
    const totalExpenses = expenseData.reduce((a, b) => a + b, 0);
    const netProfit = totalRevenue - totalExpenses;
    const margin = profitMargin(totalRevenue, totalExpenses);
    
    // Monthly profit calculation
    const monthlyProfits = revenueData.map((rev, i) => {
      const exp = expenseData[i] || 0;
      return rev - exp;
    });
    
    const profitStats = descriptiveStats(monthlyProfits);
    const profitTrend = analyzeTrend(monthlyProfits);
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      margin,
      monthlyProfits,
      profitStats,
      profitTrend,
      averageMonthlyProfit: profitStats.mean,
    };
  }, [revenueData, expenseData]);
  
  // Revenue-Expense correlation
  const correlationAnalysis = useMemo(() => {
    const corr = correlation(revenueData, expenseData);
    return {
      coefficient: corr,
      strength: Math.abs(corr) >= 0.7 ? 'strong' : Math.abs(corr) >= 0.4 ? 'moderate' : 'weak',
      relationship: corr > 0 ? 'positive' : corr < 0 ? 'negative' : 'none',
    };
  }, [revenueData, expenseData]);
  
  // Period-over-period comparison
  const periodAnalysis = useMemo(() => {
    if (revenueData.length < 2) return null;
    
    const midPoint = Math.floor(revenueData.length / 2);
    const firstHalf = revenueData.slice(0, midPoint);
    const secondHalf = revenueData.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return {
      firstHalfAvg,
      secondHalfAvg,
      growth: growthRate(secondHalfAvg, firstHalfAvg),
    };
  }, [revenueData]);
  
  return {
    invoiceAnalysis,
    expenseAnalysis,
    revenueTrend,
    expenseTrend,
    profitability,
    correlationAnalysis,
    periodAnalysis,
  };
}
