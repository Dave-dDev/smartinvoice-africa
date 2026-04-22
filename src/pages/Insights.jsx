/**
 * SmartInvoice Africa — Insights Page
 */

import { useState } from "react";
import { Btn, Panel, PanelHeader } from "../components/UI.jsx";
import { fmt, currencySymbol } from "../data/mockData.js";

export default function Insights({ currency }) {
  const sym = currencySymbol(currency);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    setLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      setInsights({
        totalIncome: 1250000,
        totalExpenses: 850000,
        topExpenseCategories: [
          { name: "Inventory", amount: 400000, percentage: 47 },
          { name: "Salaries", amount: 250000, percentage: 29 },
          { name: "Rent", amount: 100000, percentage: 12 },
          { name: "Other", amount: 100000, percentage: 12 },
        ],
        recommendations: [
          "Your inventory costs have increased by 15% this month. Consider renegotiating with suppliers.",
          "Cash flow is positive, but you have ₦350,000 in outstanding invoices. Send reminders to top debtors.",
          "You could save up to ₦50,000 on utilities by optimizing usage during off-peak hours."
        ]
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="page-content">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A4A35", margin: 0 }}>Financial Insights & Analysis</h2>
      </div>

      <div className="grid-2-wide" style={{ marginBottom: 20 }}>
        {/* Upload Panel */}
        <Panel>
          <PanelHeader title="Upload Statement of Finance" />
          <div style={{ padding: "24px 22px", textAlign: "center" }}>
            <div style={{
              border: "2px dashed #E2DAC8",
              borderRadius: 12,
              padding: "40px 20px",
              background: "#FDFAF4",
              marginBottom: 20
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
              <div style={{ fontSize: 14, color: "#1A4A35", fontWeight: 600, marginBottom: 5 }}>
                Upload Bank Statement or Financial Report
              </div>
              <div style={{ fontSize: 12, color: "#6B6455", marginBottom: 20 }}>
                Supported formats: PDF, CSV, Excel (max 5MB)
              </div>

              <input
                type="file"
                id="statement-upload"
                style={{ display: "none" }}
                onChange={handleFileUpload}
                accept=".pdf,.csv,.xlsx,.xls"
              />
              <Btn
                variant="ghost"
                onClick={() => document.getElementById("statement-upload").click()}
              >
                {file ? file.name : "Select File"}
              </Btn>
            </div>

            <Btn
              variant="forest"
              onClick={handleAnalyze}
              disabled={!file || loading}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {loading ? "Analyzing..." : "Generate Insights"}
            </Btn>
          </div>
        </Panel>

        {/* Instructions/Info Panel */}
        {!insights && !loading && (
          <Panel>
            <PanelHeader title="How it works" />
            <div style={{ padding: "24px 22px" }}>
              <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
                <div style={{ fontSize: 24 }}>1️⃣</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1A4A35" }}>Upload Document</div>
                  <div style={{ fontSize: 12, color: "#6B6455", marginTop: 4 }}>Upload your recent bank statements or financial reports securely.</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
                <div style={{ fontSize: 24 }}>2️⃣</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1A4A35" }}>AI Analysis</div>
                  <div style={{ fontSize: 12, color: "#6B6455", marginTop: 4 }}>Our system categorizes transactions and identifies spending patterns.</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 15 }}>
                <div style={{ fontSize: 24 }}>3️⃣</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1A4A35" }}>Actionable Insights</div>
                  <div style={{ fontSize: 12, color: "#6B6455", marginTop: 4 }}>Receive personalized recommendations to improve cash flow and reduce costs.</div>
                </div>
              </div>
            </div>
          </Panel>
        )}

        {/* Loading State */}
        {loading && (
          <Panel>
            <div style={{ padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <div className="spinner" style={{
                width: 40, height: 40,
                border: "4px solid #F0EDE4",
                borderTopColor: "#E8A020",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: 20
              }} />
              <div style={{ fontWeight: 600, color: "#1A4A35" }}>Analyzing financial data...</div>
              <div style={{ fontSize: 12, color: "#6B6455", marginTop: 5 }}>Identifying trends and categorizing expenses</div>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          </Panel>
        )}

        {/* Results Panel */}
        {insights && !loading && (
          <Panel>
            <PanelHeader title="Analysis Results" />
            <div style={{ padding: "20px 22px" }}>
              <div className="grid-2" style={{ gap: 15, marginBottom: 20 }}>
                <div style={{ background: "#F0FBF5", padding: "15px", borderRadius: 10, border: "1px solid #B8E6CF" }}>
                  <div style={{ fontSize: 11, color: "#6B6455", textTransform: "uppercase", letterSpacing: ".5px" }}>Analyzed Income</div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 700, color: "#1A7A50", marginTop: 5 }}>
                    {fmt(insights.totalIncome, sym)}
                  </div>
                </div>
                <div style={{ background: "#FFF4F0", padding: "15px", borderRadius: 10, border: "1px solid #FAD1C4" }}>
                  <div style={{ fontSize: 11, color: "#6B6455", textTransform: "uppercase", letterSpacing: ".5px" }}>Analyzed Expenses</div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 700, color: "#C4522A", marginTop: 5 }}>
                    {fmt(insights.totalExpenses, sym)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A4A35", marginBottom: 10 }}>Top Expense Categories</div>
                {insights.topExpenseCategories.map((cat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ width: "30%", fontSize: 12 }}>{cat.name}</div>
                    <div style={{ width: "50%", padding: "0 10px" }}>
                      <div style={{ height: 6, background: "#F0EDE4", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${cat.percentage}%`, height: "100%", background: "#E8A020", borderRadius: 3 }} />
                      </div>
                    </div>
                    <div style={{ width: "20%", textAlign: "right", fontSize: 12, fontWeight: 600 }}>{fmt(cat.amount, sym)}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A4A35", marginBottom: 10 }}>💡 AI Recommendations</div>
                {insights.recommendations.map((rec, i) => (
                  <div key={i} style={{
                    padding: "10px 14px",
                    background: "#FDFAF4",
                    borderLeft: "3px solid #E8A020",
                    borderRadius: "0 8px 8px 0",
                    fontSize: 12,
                    color: "#4A453A",
                    marginBottom: 8
                  }}>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
