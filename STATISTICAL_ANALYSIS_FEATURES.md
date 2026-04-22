# Statistical Analysis Features - SmartInvoice Africa

## Overview
Comprehensive statistical analysis has been successfully integrated into SmartInvoice Africa, providing deep insights into financial data, trends, and business performance.

---

## 📊 Statistical Functions (`src/lib/statistics.js`)

### Descriptive Statistics
- **`descriptiveStats(data)`** - Complete statistical analysis including:
  - Mean, Median, Mode
  - Standard Deviation, Variance
  - Min, Max, Range
  - Quartiles (Q1, Q3), Interquartile Range (IQR)
  - Count of data points

### Trend Analysis
- **`growthRate(current, previous)`** - Calculate percentage growth between periods
- **`movingAverage(data, window)`** - Calculate rolling averages for smoothing trends
- **`analyzeTrend(data)`** - Determine trend direction (increasing/decreasing/stable) and strength
- **`periodComparison(current, previous)`** - Compare performance across different periods

### Financial Metrics
- **`profitMargin(revenue, expenses)`** - Calculate profit margin percentage
- **`correlation(x, y)`** - Pearson correlation coefficient between two datasets
- **`detectOutliers(data)`** - Identify statistical outliers using IQR method
- **`categoryDistribution(expenses)`** - Analyze expense distribution by category
- **`invoiceStats(invoices)`** - Calculate invoice payment statistics and collection rates

---

## 🎯 Statistical Analysis Hook (`src/hooks/useStatisticalAnalysis.js`)

The `useStatisticalAnalysis` hook provides reactive, memoized statistical computations:

### Input Parameters
- `invoices` - Array of invoice data
- `expenses` - Array of expense data  
- `revenueData` - Monthly revenue time series
- `expenseData` - Monthly expense time series

### Returns Comprehensive Analysis

#### 1. **Invoice Analysis** (`invoiceAnalysis`)
- Average and median invoice amounts
- Collection ratio and payment rates
- Overdue rate and pending invoices
- Statistical distribution (std dev, variance, quartiles)

#### 2. **Expense Analysis** (`expenseAnalysis`)
- Average and typical expense amounts
- Category-wise distribution and percentages
- Outlier detection for unusual expenses
- Expense variability metrics

#### 3. **Revenue Trend** (`revenueTrend`)
- Month-over-month growth rate
- 3-period moving average
- Trend direction and strength
- Latest vs previous period comparison

#### 4. **Expense Trend** (`expenseTrend`)
- Expense growth patterns
- Moving average analysis
- Trend direction indicators

#### 5. **Profitability Analysis** (`profitability`)
- Total revenue, expenses, net profit
- Profit margin percentage
- Monthly profit calculations
- Profit trend analysis

#### 6. **Correlation Analysis** (`correlationAnalysis`)
- Revenue vs Expenses correlation coefficient
- Relationship strength (strong/moderate/weak)
- Relationship type (positive/negative/none)

#### 7. **Period Analysis** (`periodAnalysis`)
- First half vs second half comparison
- Period-over-period growth rates

---

## 📱 Dashboard Integration (`src/pages/Dashboard.jsx`)

### Statistical Insights Panel
A comprehensive panel displaying:

#### Invoice Analysis Card
- Average invoice value
- Median invoice value
- Collection rate percentage

#### Expense Analysis Card
- Average expense amount
- Highest expense recorded
- Number of expense categories

#### Profitability Card
- Current profit margin
- Average monthly profit
- Profit trend with direction indicator

#### Trend Analysis Section
- Revenue trend with direction and strength
- Expense trend analysis
- 3-period moving averages
- Month-over-month growth comparison

#### Correlation Analysis
- Revenue vs Expenses correlation coefficient
- Correlation strength indicator
- Top expense categories by percentage

#### Variability Metrics
- Revenue standard deviation
- Expense variability
- Invoice amount range (min-max)

### Enhanced Metric Cards
- Revenue with growth trend
- Overdue invoices with overdue rate
- Average invoice with standard deviation
- Net profit with profit margin

---

## 📈 Reports Page Enhancements (`src/pages/Reports.jsx`)

### Statistical Imports
All statistical functions are imported and available for advanced reporting:
- Descriptive statistics
- Growth rate analysis
- Trend analysis
- Moving averages
- Profit margin calculations
- Outlier detection
- Period comparisons

### Invoice Payment Performance
- Average payment time
- On-time payment rate
- Online payment percentage
- Payment status distribution

---

## 🎨 Visual Components

### Color-Coded Indicators
- **Green (#1A7A50)** - Positive metrics, healthy growth
- **Red (#C4522A)** - Warning metrics, overdue items
- **Gold (#E8A020)** - Neutral/attention metrics
- **Blue (#4AACB8)** - Informational metrics

### Trend Indicators
- 📈 Increasing trends
- 📉 Decreasing trends
- ➡️ Stable trends

---

## 🔧 Usage Examples

### In Components
```javascript
import { useStatisticalAnalysis } from "../hooks/useStatisticalAnalysis";
import { descriptiveStats, growthRate } from "../lib/statistics";

// Use the hook
const stats = useStatisticalAnalysis(invoices, expenses, revenue, expenses);

// Access analysis
const avgInvoice = stats.invoiceAnalysis.mean;
const profitMargin = stats.profitability.margin;
const revenueGrowth = stats.revenueTrend.growth;
const correlation = stats.correlationAnalysis.coefficient;
```

### Direct Function Usage
```javascript
// Calculate statistics for custom data
const amounts = invoices.map(i => i.amount);
const stats = descriptiveStats(amounts);

// Analyze trends
const trend = analyzeTrend(monthlyRevenue);

// Detect outliers
const outliers = detectOutliers(expenseAmounts);
```

---

## 📊 Key Metrics Provided

### Invoice Metrics
- Average invoice amount
- Median invoice amount
- Collection ratio
- Overdue rate
- Payment distribution

### Expense Metrics
- Average expense
- Expense by category
- Expense outliers
- Category percentages

### Profitability Metrics
- Gross profit margin
- Net profit
- Monthly profit trends
- Profit variability

### Trend Metrics
- Revenue growth rate
- Expense growth rate
- Profit trend direction
- Moving averages

### Statistical Metrics
- Standard deviation
- Variance
- Quartiles
- Correlation coefficients
- Outlier detection

---

## 🚀 Benefits

1. **Data-Driven Decisions** - Make informed business decisions based on statistical insights
2. **Trend Identification** - Spot revenue and expense trends early
3. **Anomaly Detection** - Identify unusual transactions or outliers
4. **Performance Tracking** - Monitor collection rates and profit margins
5. **Predictive Insights** - Use moving averages for forecasting
6. **Correlation Analysis** - Understand relationships between revenue and expenses

---

## 📝 Notes

- All calculations are memoized for performance
- Real-time updates supported through React hooks
- Responsive design with mobile-friendly layouts
- Color-coded for quick visual assessment
- Export-ready for reports and presentations

---

**Implementation Date:** April 2026  
**Status:** ✅ Complete and Production-Ready
