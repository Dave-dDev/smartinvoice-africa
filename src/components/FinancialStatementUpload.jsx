/**
 * Financial Statement Upload Component
 * Allows users to upload bank statements, financial reports, and accounting data
 */

import { useState, useRef } from "react";
import { Btn, Panel } from "./UI.jsx";

export default function FinancialStatementUpload({ onFileProcessed, sym = "₦" }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const inputRef = useRef(null);

  const SUPPORTED_FORMATS = [
    { ext: ".csv", label: "CSV", icon: "📊", mime: "text/csv" },
    { ext: ".xlsx", label: "Excel", icon: "📈", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { ext: ".xls", label: "Excel", icon: "📈", mime: "application/vnd.ms-excel" },
    { ext: ".pdf", label: "PDF", icon: "📄", mime: "application/pdf" },
    { ext: ".json", label: "JSON", icon: "🔧", mime: "application/json" },
  ];

  const handleFile = async (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/pdf", "application/json"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|pdf|json)$/i)) {
      alert("Please upload a valid file format: CSV, Excel, PDF, or JSON");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Read file content
      const content = await readFileContent(file);
      
      // Parse based on file type
      const parsedData = await parseFinancialData(content, file.type, file.name);
      
      setUploadProgress(100);
      setPreviewData(parsedData);
      
      setTimeout(() => {
        setUploading(false);
        if (onFileProcessed) {
          onFileProcessed(parsedData, file);
        }
      }, 500);
      
      clearInterval(progressInterval);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process file: " + error.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      
      if (file.type === "application/pdf") {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const parseFinancialData = async (content, fileType, fileName) => {
    // Mock parsing logic - in production, you'd use libraries like PapaParse for CSV, xlsx for Excel, etc.
    const mockTransactions = [
      { date: "2025-07-01", description: "Opening Balance", amount: 5000000, type: "credit", category: "Balance" },
      { date: "2025-07-02", description: "Payment from TechKing Solutions", amount: 850000, type: "credit", category: "Revenue" },
      { date: "2025-07-03", description: "Lagos Market Co. - Inventory Purchase", amount: -1900000, type: "debit", category: "Inventory" },
      { date: "2025-07-05", description: "Payment from Greenstar Supplies", amount: 675000, type: "credit", category: "Revenue" },
      { date: "2025-07-08", description: "AEDC Electric - Power Bill", amount: -45000, type: "debit", category: "Utilities" },
      { date: "2025-07-10", description: "Meta Ads - Facebook Campaign", amount: -80000, type: "debit", category: "Marketing" },
      { date: "2025-07-11", description: "DHL Nigeria - Delivery", amount: -85000, type: "debit", category: "Transport" },
      { date: "2025-07-12", description: "Payment from MegaWorks Ltd", amount: 450000, type: "credit", category: "Revenue" },
      { date: "2025-07-14", description: "Stock Depot - Restock", amount: -420000, type: "debit", category: "Inventory" },
      { date: "2025-07-15", description: "Staff Salaries", amount: -300000, type: "debit", category: "Salaries" },
      { date: "2025-07-18", description: "Payment from Fola & Sons", amount: 1200000, type: "credit", category: "Revenue" },
      { date: "2025-07-20", description: "UPS Logistics - Kano Delivery", amount: -65000, type: "debit", category: "Transport" },
      { date: "2025-07-22", description: "Water Board", amount: -18000, type: "debit", category: "Utilities" },
      { date: "2025-07-25", description: "Payment from Bayero Nig. Ltd", amount: 320000, type: "credit", category: "Revenue" },
      { date: "2025-07-28", description: "Miscellaneous Expenses", amount: -50000, type: "debit", category: "Other" },
    ];

    // Calculate summary
    const totalCredits = mockTransactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = mockTransactions.filter(t => t.type === "debit").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netChange = totalCredits - totalDebits;
    const closingBalance = 5000000 + netChange;

    // Category breakdown
    const categorySummary = {};
    mockTransactions.filter(t => t.type === "debit").forEach(t => {
      if (!categorySummary[t.category]) {
        categorySummary[t.category] = 0;
      }
      categorySummary[t.category] += Math.abs(t.amount);
    });

    return {
      fileName,
      fileType,
      uploadDate: new Date().toISOString(),
      transactions: mockTransactions,
      summary: {
        totalCredits,
        totalDebits,
        netChange,
        openingBalance: 5000000,
        closingBalance,
        transactionCount: mockTransactions.length,
        period: {
          start: "2025-07-01",
          end: "2025-07-31"
        }
      },
      categoryBreakdown: categorySummary,
      insights: generateInsights(mockTransactions, totalCredits, totalDebits)
    };
  };

  const generateInsights = (transactions, credits, debits) => {
    const insights = [];
    
    // Revenue insight
    if (credits > 3000000) {
      insights.push({ type: "positive", icon: "📈", text: "Strong revenue performance this period" });
    }
    
    // Expense ratio
    const expenseRatio = (debits / credits) * 100;
    if (expenseRatio > 70) {
      insights.push({ type: "warning", icon: "⚠️", text: `High expense ratio (${expenseRatio.toFixed(1)}%). Consider cost optimization.` });
    } else if (expenseRatio < 50) {
      insights.push({ type: "positive", icon: "✅", text: `Healthy expense ratio (${expenseRatio.toFixed(1)}%). Good cost management.` });
    }
    
    // Top expense category
    const categoryTotals = {};
    transactions.filter(t => t.type === "debit").forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    });
    
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      insights.push({ type: "info", icon: "📊", text: `Largest expense category: ${topCategory[0]} (${(topCategory[1] / debits * 100).toFixed(1)}%)` });
    }
    
    // Cash flow
    const netChange = credits - debits;
    if (netChange > 0) {
      insights.push({ type: "positive", icon: "💰", text: `Positive cash flow of ${formatCurrency(netChange)}` });
    } else {
      insights.push({ type: "warning", icon: "💸", text: `Negative cash flow of ${formatCurrency(Math.abs(netChange))}` });
    }
    
    return insights;
  };

  const formatCurrency = (amount) => {
    return `${sym} ${Math.abs(amount).toLocaleString("en-NG")}`;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Upload Area */}
      <Panel>
        <div style={{ padding: "24px 22px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, fontFamily: "Syne,sans-serif" }}>
            📤 Upload Financial Statement
          </div>
          <div style={{ fontSize: 12.5, color: "#6B6455", marginBottom: 16 }}>
            Upload bank statements, financial reports, or accounting data for automated analysis
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? "#1A7A50" : "#E2DAC8"}`,
              borderRadius: 12,
              padding: "40px 20px",
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              background: dragActive ? "#F0F7F4" : uploading ? "#F9F6EF" : "#FDFAF4",
              transition: "all 0.2s",
              opacity: uploading ? 0.7 : 1
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,.json"
              style={{ display: "none" }}
              onChange={handleInputChange}
              disabled={uploading}
            />
            
            {uploading ? (
              <div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Processing file...</div>
                <div style={{ fontSize: 12, color: "#6B6455", marginBottom: 12 }}>{selectedFile?.name}</div>
                <div style={{ 
                  width: 200, 
                  height: 6, 
                  background: "#E2DAC8", 
                  borderRadius: 3, 
                  margin: "0 auto",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: "100%",
                    background: "#1A7A50",
                    transition: "width 0.3s"
                  }} />
                </div>
                <div style={{ fontSize: 11, color: "#6B6455", marginTop: 6 }}>{uploadProgress}%</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 42, marginBottom: 12 }}>📁</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                  Drag & drop your file here, or <span style={{ color: "#1A7A50", textDecoration: "underline" }}>browse</span>
                </div>
                <div style={{ fontSize: 12, color: "#6B6455", marginBottom: 16 }}>
                  Supports CSV, Excel, PDF, JSON (max 10MB)
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  {SUPPORTED_FORMATS.map((fmt) => (
                    <div key={fmt.ext} style={{ 
                      fontSize: 11, 
                      padding: "4px 10px", 
                      background: "#F0EDE4", 
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      <span>{fmt.icon}</span>
                      <span>{fmt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* Preview & Insights */}
      {previewData && (
        <FinancialInsightsPanel 
          data={previewData} 
          sym={sym}
          onClear={() => {
            setPreviewData(null);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
}

// ── Financial Insights Panel ─────────────────────────────────────────────────
function FinancialInsightsPanel({ data, sym, onClear }) {
  const { summary, transactions, categoryBreakdown, insights, fileName } = data;

  const formatCurrency = (amount) => {
    return `${sym} ${amount.toLocaleString("en-NG")}`;
  };

  return (
    <div style={{ marginTop: 20 }}>
      {/* File Info Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 16,
        padding: "12px 16px",
        background: "#F0F7F4",
        borderRadius: 10,
        border: "1px solid #D4EDE3"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{fileName}</div>
            <div style={{ fontSize: 11, color: "#6B6455" }}>
              {summary.transactionCount} transactions · {summary.period.start} to {summary.period.end}
            </div>
          </div>
        </div>
        <button
          onClick={onClear}
          style={{
            background: "none",
            border: "1px solid #E2DAC8",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 11,
            color: "#6B6455"
          }}
        >
          ✕ Clear
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <SummaryCard
          icon="💵"
          label="Opening Balance"
          value={formatCurrency(summary.openingBalance)}
          color="#1A4A35"
          bg="#F0F7F4"
        />
        <SummaryCard
          icon="📥"
          label="Total Income"
          value={formatCurrency(summary.totalCredits)}
          color="#1A7A50"
          bg="#D4EDE3"
        />
        <SummaryCard
          icon="📤"
          label="Total Expenses"
          value={formatCurrency(summary.totalDebits)}
          color="#C4522A"
          bg="#FAE0D5"
        />
        <SummaryCard
          icon="💰"
          label="Closing Balance"
          value={formatCurrency(summary.closingBalance)}
          color={summary.closingBalance > summary.openingBalance ? "#1A7A50" : "#C4522A"}
          bg={summary.closingBalance > summary.openingBalance ? "#D4EDE3" : "#FAE0D5"}
        />
      </div>

      {/* Insights */}
      <Panel style={{ marginBottom: 20 }}>
        <div style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, fontFamily: "Syne,sans-serif" }}>
            🧠 AI Insights
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 14px",
                  background: insight.type === "positive" ? "#F0F7F4" : 
                             insight.type === "warning" ? "#FFF4F0" : "#F8F4F0",
                  borderRadius: 8,
                  border: `1px solid ${
                    insight.type === "positive" ? "#D4EDE3" : 
                    insight.type === "warning" ? "#FAE0D5" : "#F0EDE4"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <span style={{ fontSize: 18 }}>{insight.icon}</span>
                <span style={{ fontSize: 12.5, color: "#1A4A35", flex: 1 }}>{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Category Breakdown */}
      <div className="grid-2-wide" style={{ marginBottom: 20 }}>
        <Panel>
          <div style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, fontFamily: "Syne,sans-serif" }}>
              📊 Expense Breakdown by Category
            </div>
            {Object.entries(categoryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount], idx) => {
                const percentage = (amount / summary.totalDebits) * 100;
                return (
                  <div key={category} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#6B6455" }}>{category}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{ 
                      width: "100%", 
                      height: 6, 
                      background: "#F0EDE4", 
                      borderRadius: 3,
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: "100%",
                        background: idx === 0 ? "#C4522A" : idx === 1 ? "#E8A020" : "#4AACB8",
                        borderRadius: 3
                      }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </Panel>

        {/* Recent Transactions */}
        <Panel>
          <div style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, fontFamily: "Syne,sans-serif" }}>
              📝 Recent Transactions
            </div>
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {transactions.slice(0, 10).map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: idx < 9 ? "1px solid #F0EDE4" : "none"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{t.description}</div>
                    <div style={{ fontSize: 10.5, color: "#6B6455", marginTop: 2 }}>
                      {t.date} · {t.category}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: t.type === "credit" ? "#1A7A50" : "#C4522A",
                    fontFamily: "Syne,sans-serif"
                  }}>
                    {t.type === "credit" ? "+" : "-"}{formatCurrency(Math.abs(t.amount))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color, bg }) {
  return (
    <div style={{
      padding: "18px 20px",
      background: bg,
      borderRadius: 12,
      border: `1px solid ${color}20`
    }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 10.5, color: "#6B6455", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}
