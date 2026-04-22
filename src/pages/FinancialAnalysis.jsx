/**
 * SmartInvoice Africa — Financial Analysis Page
 * Upload bank statements & financial reports for automated analysis & insights.
 */

import { useState } from "react";
import FinancialStatementUpload from "../components/FinancialStatementUpload.jsx";

const CURRENCY_SYMBOLS = {
  NGN: "₦", KES: "KSh", GHS: "₵", ZAR: "R", UGX: "USh", TZS: "TSh", ETB: "Br",
};

const FEATURES = [
  {
    icon: "🏦",
    title: "Bank Statement Analysis",
    desc: "Upload CSV or PDF statements from any Nigerian, Kenyan, or South African bank.",
  },
  {
    icon: "📊",
    title: "Expense Categorisation",
    desc: "Automatically groups transactions by category: salaries, utilities, inventory, and more.",
  },
  {
    icon: "🧠",
    title: "AI-Powered Insights",
    desc: "Detects cash-flow trends, flags anomalies, and recommends cost-saving opportunities.",
  },
  {
    icon: "📈",
    title: "Period Comparison",
    desc: "Compare month-over-month or quarter-over-quarter performance at a glance.",
  },
];

export default function FinancialAnalysis({ currency = "NGN" }) {
  const sym = CURRENCY_SYMBOLS[currency] || "₦";
  const [uploadHistory, setUploadHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("upload"); // "upload" | "history"

  const handleFileProcessed = (data, file) => {
    setUploadHistory((prev) => [
      {
        id: Date.now(),
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
        data,
      },
      ...prev,
    ]);
    // Switch to history tab after processing
    setActiveTab("history");
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + " min ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + " hr ago";
    return date.toLocaleDateString("en-NG");
  };

  return (
    <div style={{ padding: "28px 28px 48px" }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg,#1A7A50,#1A4A35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 4px 14px rgba(26,122,80,.25)",
            }}
          >
            📂
          </div>
          <div>
            <h1
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: 22,
                fontWeight: 800,
                color: "#1A4A35",
                margin: 0,
              }}
            >
              Financial Analysis
            </h1>
            <p style={{ fontSize: 13, color: "#6B6455", margin: 0 }}>
              Upload statements and get instant insights into your business finances
            </p>
          </div>
        </div>
      </div>

      {/* ── Feature Highlights ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              background: "#fff",
              border: "1px solid #EDE9DC",
              borderRadius: 12,
              padding: "16px 18px",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              boxShadow: "0 1px 4px rgba(0,0,0,.04)",
            }}
          >
            <div
              style={{
                fontSize: 22,
                width: 38,
                height: 38,
                borderRadius: 9,
                background: "#F0F7F4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A4A35", marginBottom: 3 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 11.5, color: "#6B6455", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #EDE9DC" }}>
        {[
          { id: "upload", label: "📤 Upload Statement" },
          {
            id: "history",
            label: `📁 Analysis History${uploadHistory.length ? ` (${uploadHistory.length})` : ""}`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              padding: "10px 18px",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: activeTab === tab.id ? 700 : 400,
              color: activeTab === tab.id ? "#1A7A50" : "#6B6455",
              borderBottom: `2px solid ${activeTab === tab.id ? "#1A7A50" : "transparent"}`,
              marginBottom: -2,
              transition: "all .15s",
              fontFamily: activeTab === tab.id ? "Syne, sans-serif" : "inherit",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Upload Tab ── */}
      {activeTab === "upload" && (
        <FinancialStatementUpload onFileProcessed={handleFileProcessed} sym={sym} />
      )}

      {/* ── History Tab ── */}
      {activeTab === "history" && (
        <div>
          {uploadHistory.length === 0 ? (
            <EmptyHistory onUpload={() => setActiveTab("upload")} />
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {uploadHistory.map((entry) => (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  sym={sym}
                  formatFileSize={formatFileSize}
                  formatRelativeTime={formatRelativeTime}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Empty History State ────────────────────────────────────────────────────────
function EmptyHistory({ onUpload }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 24px",
        background: "#FDFAF4",
        borderRadius: 14,
        border: "1px dashed #E2DAC8",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
      <div
        style={{
          fontFamily: "Syne, sans-serif",
          fontSize: 16,
          fontWeight: 700,
          color: "#1A4A35",
          marginBottom: 8,
        }}
      >
        No analyses yet
      </div>
      <div style={{ fontSize: 13, color: "#6B6455", marginBottom: 20 }}>
        Upload your first financial statement to see insights here
      </div>
      <button
        onClick={onUpload}
        style={{
          background: "linear-gradient(135deg,#1A7A50,#1A4A35)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 22px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "Syne, sans-serif",
        }}
      >
        📤 Upload Statement
      </button>
    </div>
  );
}

// ── History Card ───────────────────────────────────────────────────────────────
function HistoryCard({ entry, sym, formatFileSize, formatRelativeTime }) {
  const [expanded, setExpanded] = useState(false);
  const { data, fileName, fileSize, uploadedAt } = entry;
  const { summary, insights } = data;

  const fmt = (n) => `${sym} ${Math.abs(n).toLocaleString("en-NG")}`;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #EDE9DC",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 6px rgba(0,0,0,.05)",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#F0F7F4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          📄
        </div>

        <div style={{ flex: 1, overflow: "hidden" }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "#1A4A35",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {fileName}
          </div>
          <div style={{ fontSize: 11, color: "#6B6455", marginTop: 2 }}>
            {formatFileSize(fileSize)} · {formatRelativeTime(uploadedAt)} ·{" "}
            {summary.transactionCount} transactions
          </div>
        </div>

        {/* Quick stats */}
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#6B6455", textTransform: "uppercase", letterSpacing: ".5px" }}>
              Net Cash Flow
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Syne, sans-serif",
                color: summary.netChange >= 0 ? "#1A7A50" : "#C4522A",
              }}
            >
              {summary.netChange >= 0 ? "+" : "-"}
              {fmt(summary.netChange)}
            </div>
          </div>

          <div
            style={{
              fontSize: 16,
              color: "#6B6455",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform .2s",
            }}
          >
            ▾
          </div>
        </div>
      </div>

      {/* Expanded: Summary metrics + insights */}
      {expanded && (
        <div style={{ borderTop: "1px solid #EDE9DC", padding: "16px 20px" }}>
          {/* Metrics row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {[
              { label: "Opening Balance", value: fmt(summary.openingBalance), color: "#1A4A35", bg: "#F0F7F4" },
              { label: "Total Income", value: fmt(summary.totalCredits), color: "#1A7A50", bg: "#D4EDE3" },
              { label: "Total Expenses", value: fmt(summary.totalDebits), color: "#C4522A", bg: "#FAE0D5" },
              { label: "Closing Balance", value: fmt(summary.closingBalance),
                color: summary.closingBalance >= summary.openingBalance ? "#1A7A50" : "#C4522A",
                bg: summary.closingBalance >= summary.openingBalance ? "#D4EDE3" : "#FAE0D5" },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  background: m.bg,
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: `1px solid ${m.color}20`,
                }}
              >
                <div style={{ fontSize: 10, color: "#6B6455", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 700, color: m.color }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div style={{ display: "grid", gap: 8 }}>
            {insights.map((ins, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background:
                    ins.type === "positive" ? "#F0F7F4" : ins.type === "warning" ? "#FFF4F0" : "#F8F4F0",
                  border: `1px solid ${
                    ins.type === "positive" ? "#D4EDE3" : ins.type === "warning" ? "#FAE0D5" : "#F0EDE4"
                  }`,
                }}
              >
                <span style={{ fontSize: 16 }}>{ins.icon}</span>
                <span style={{ fontSize: 12, color: "#1A4A35" }}>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
