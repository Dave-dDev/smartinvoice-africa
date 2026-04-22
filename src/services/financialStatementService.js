/**
 * Financial Statement Parser Service
 * Handles parsing of various financial document formats
 */

/**
 * Parse CSV financial data
 * @param {string} content - CSV file content
 * @returns {Object} Parsed transaction data
 */
export function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const transaction = {};
    
    headers.forEach((header, idx) => {
      transaction[header] = values[idx];
    });
    
    transactions.push({
      date: transaction.date || transaction.transaction_date,
      description: transaction.description || transaction.narration || transaction.details,
      amount: parseFloat(transaction.amount || transaction.value || 0),
      type: transaction.type || (parseFloat(transaction.amount) > 0 ? 'credit' : 'debit'),
      category: transaction.category || transaction.type || 'Uncategorized',
      balance: transaction.balance || null,
      reference: transaction.reference || transaction.ref || null
    });
  }
  
  return { transactions, format: 'csv' };
}

/**
 * Parse JSON financial data
 * @param {string} content - JSON file content
 * @returns {Object} Parsed transaction data
 */
export function parseJSON(content) {
  try {
    const data = JSON.parse(content);
    
    // Handle different JSON structures
    if (Array.isArray(data)) {
      return { transactions: data, format: 'json' };
    }
    
    if (data.transactions) {
      return { transactions: data.transactions, format: 'json', metadata: data };
    }
    
    if (data.data) {
      return { transactions: data.data, format: 'json', metadata: data };
    }
    
    return { transactions: [data], format: 'json' };
  } catch (error) {
    throw new Error('Invalid JSON format: ' + error.message);
  }
}

/**
 * Parse Excel file content (requires xlsx library in production)
 * @param {string} content - Excel file content as base64 or binary
 * @returns {Object} Parsed transaction data
 */
export async function parseExcel(content) {
  // In production, use a library like 'xlsx' or 'exceljs'
  // This is a mock implementation
  console.log('Excel parsing would be implemented here with xlsx library');
  
  // Mock data for demonstration
  return {
    transactions: [
      { date: '2025-07-01', description: 'Excel Import - Opening Balance', amount: 5000000, type: 'credit', category: 'Balance' },
      { date: '2025-07-05', description: 'Excel Import - Revenue', amount: 1500000, type: 'credit', category: 'Revenue' },
      { date: '2025-07-10', description: 'Excel Import - Expense', amount: -750000, type: 'debit', category: 'Expenses' }
    ],
    format: 'excel'
  };
}

/**
 * Parse PDF financial statement (requires PDF parsing library)
 * @param {ArrayBuffer} content - PDF file content
 * @returns {Object} Parsed transaction data
 */
export async function parsePDF(content) {
  // In production, use a library like 'pdf-parse' or 'pdfjs-dist'
  // This is a mock implementation
  console.log('PDF parsing would be implemented here with pdf-parse library');
  
  // Mock data for demonstration
  return {
    transactions: [
      { date: '2025-07-01', description: 'PDF Import - Opening Balance', amount: 5000000, type: 'credit', category: 'Balance' },
      { date: '2025-07-15', description: 'PDF Import - Revenue', amount: 2000000, type: 'credit', category: 'Revenue' },
      { date: '2025-07-20', description: 'PDF Import - Expense', amount: -1200000, type: 'debit', category: 'Expenses' }
    ],
    format: 'pdf'
  };
}

/**
 * Calculate financial summary from transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Financial summary
 */
export function calculateSummary(transactions) {
  const credits = transactions.filter(t => t.type === 'credit' || t.amount > 0);
  const debits = transactions.filter(t => t.type === 'debit' || t.amount < 0);
  
  const totalCredits = credits.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalDebits = debits.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netChange = totalCredits - totalDebits;
  
  // Get date range
  const dates = transactions.map(t => new Date(t.date)).filter(d => !isNaN(d));
  const startDate = dates.length > 0 ? dates.sort((a, b) => a - b)[0] : null;
  const endDate = dates.length > 0 ? dates.sort((a, b) => b - a)[0] : null;
  
  // Category breakdown
  const categoryBreakdown = {};
  debits.forEach(t => {
    const category = t.category || 'Uncategorized';
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(t.amount);
  });
  
  return {
    totalCredits,
    totalDebits,
    netChange,
    transactionCount: transactions.length,
    creditCount: credits.length,
    debitCount: debits.length,
    period: {
      start: startDate ? startDate.toISOString().split('T')[0] : null,
      end: endDate ? endDate.toISOString().split('T')[0] : null
    },
    categoryBreakdown
  };
}

/**
 * Generate financial insights from transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} summary - Financial summary object
 * @returns {Array} Array of insight objects
 */
export function generateInsights(transactions, summary) {
  const insights = [];
  
  // Cash flow insight
  if (summary.netChange > 0) {
    insights.push({
      type: 'positive',
      icon: '💰',
      text: `Positive cash flow of ₦${Math.abs(summary.netChange).toLocaleString('en-NG')}`
    });
  } else if (summary.netChange < 0) {
    insights.push({
      type: 'warning',
      icon: '💸',
      text: `Negative cash flow of ₦${Math.abs(summary.netChange).toLocaleString('en-NG')}`
    });
  }
  
  // Expense ratio
  if (summary.totalCredits > 0) {
    const expenseRatio = (summary.totalDebits / summary.totalCredits) * 100;
    if (expenseRatio > 70) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        text: `High expense ratio (${expenseRatio.toFixed(1)}%). Consider cost optimization.`
      });
    } else if (expenseRatio < 50) {
      insights.push({
        type: 'positive',
        icon: '✅',
        text: `Healthy expense ratio (${expenseRatio.toFixed(1)}%). Good cost management.`
      });
    }
  }
  
  // Revenue performance
  if (summary.totalCredits > 3000000) {
    insights.push({
      type: 'positive',
      icon: '📈',
      text: 'Strong revenue performance this period'
    });
  }
  
  // Top expense category
  const categories = Object.entries(summary.categoryBreakdown);
  if (categories.length > 0) {
    const topCategory = categories.sort((a, b) => b[1] - a[1])[0];
    const percentage = (topCategory[1] / summary.totalDebits) * 100;
    insights.push({
      type: 'info',
      icon: '📊',
      text: `Largest expense: ${topCategory[0]} (${percentage.toFixed(1)}%)`
    });
  }
  
  // Transaction volume
  if (summary.transactionCount > 50) {
    insights.push({
      type: 'info',
      icon: '📝',
      text: `High transaction volume (${summary.transactionCount} transactions)`
    });
  }
  
  return insights;
}

/**
 * Detect anomalies in financial data
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Array of anomalies
 */
export function detectAnomalies(transactions) {
  const anomalies = [];
  const amounts = transactions.map(t => Math.abs(t.amount));
  
  // Calculate statistical thresholds
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / amounts.length);
  const threshold = mean + (2 * stdDev);
  
  // Find outliers
  transactions.forEach(t => {
    if (Math.abs(t.amount) > threshold) {
      anomalies.push({
        type: 'outlier',
        transaction: t,
        reason: `Unusually large amount: ₦${Math.abs(t.amount).toLocaleString('en-NG')}`
      });
    }
  });
  
  // Check for duplicate transactions
  const seen = new Set();
  transactions.forEach(t => {
    const key = `${t.date}-${t.description}-${Math.abs(t.amount)}`;
    if (seen.has(key)) {
      anomalies.push({
        type: 'duplicate',
        transaction: t,
        reason: 'Possible duplicate transaction'
      });
    }
    seen.add(key);
  });
  
  return anomalies;
}

/**
 * Export transactions to CSV format
 * @param {Array} transactions - Array of transaction objects
 * @returns {string} CSV formatted string
 */
export function exportToCSV(transactions) {
  const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Balance'];
  const rows = transactions.map(t => [
    t.date,
    `"${t.description}"`,
    t.amount,
    t.type,
    t.category,
    t.balance || ''
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Export transactions to JSON format
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} metadata - Optional metadata
 * @returns {string} JSON formatted string
 */
export function exportToJSON(transactions, metadata = {}) {
  return JSON.stringify({
    transactions,
    metadata: {
      ...metadata,
      exportDate: new Date().toISOString(),
      totalTransactions: transactions.length
    }
  }, null, 2);
}
