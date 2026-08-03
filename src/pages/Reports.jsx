/**
 * SmartInvoice Africa — Reports Page
 * Enhanced with interactive SVG charts, export, and invoice performance.
 */

import { useState } from "react";
import { Btn, Panel, PanelHeader } from "../components/UI.jsx";
import { BarChart } from "../components/MiniChart.jsx";
import { MONTHLY_REVENUE, MONTHLY_EXPENSES, MONTHS, fmt, currencySymbol } from "../data/mockData.js";
import { exportInvoicesCsv } from "../lib/csvExport.js";

const EXPORT_REPORTS = [
  { icon:"🧾", label:"VAT Remittance Report",  desc:"July 2025 · ₦930K due",      bg:"#FFF4D6" },
  { icon:"📋", label:"WHT Summary",             desc:"Q2 2025 · 5% rate",           bg:"#D8EAF8" },
  { icon:"💰", label:"P&L Statement",           desc:"Jan–Jul 2025",                bg:"#D4EDE3" },
  { icon:"📊", label:"Accounts Receivable",     desc:"Outstanding debtors",         bg:"#FAE0D5" },
];

export default function Reports({ invoices, currency }) {
  const sym    = currencySymbol(currency);
  const totRev = MONTHLY_REVENUE.reduce((a, b)  => a + b, 0);
  const totExp = MONTHLY_EXPENSES.reduce((a, b) => a + b, 0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [exportMsg, setExportMsg] = useState(null);

  const handleExport = () => {
    const filename = exportInvoicesCsv(invoices || [], "all", sym);
    setExportMsg(`✅ Downloaded ${filename}`);
    setTimeout(() => setExportMsg(null), 3000);
  };

  return (
    <div className="page-content">
      {/* ── KPI Strip ── */}
      <div className="grid-3" style={{ marginBottom:22 }}>
        {[
          { label:"Annual Revenue",  val:fmt(totRev,          sym), icon:"📈", color:"#1A4A35" },
          { label:"Annual Expenses", val:fmt(totExp,          sym), icon:"📉", color:"#C4522A" },
          { label:"Net Profit",      val:fmt(totRev - totExp, sym), icon:"💰", color:"#1A7A50" },
        ].map((s, i) => (
          <div key={i} style={{ background:"#FDFAF4", border:"1px solid #E2DAC8", borderRadius:12, padding:"20px 22px" }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:".7px", color:"#6B6455", marginBottom:5 }}>{s.label}</div>
            <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid-2-wide" style={{ marginBottom:20 }}>
        {/* Interactive SVG Bar Chart */}
        <Panel>
          <div style={{ padding:"16px 22px 8px", borderBottom:"1px solid #E2DAC8", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:700 }}>
              Revenue vs Expenses · 2025
            </span>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              {/* Legend */}
              {[["Revenue","#1A4A35"],["Expenses","#C4522A"],["Profit","#E8A020"]].map(([l, c]) => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:c }} />
                  <span style={{ fontSize:11, color:"#6B6455" }}>{l}</span>
                </div>
              ))}
              <button
                onClick={() => setShowOverlay(v => !v)}
                style={{ fontSize:10, padding:"3px 8px", borderRadius:6, border:"1px solid #E2DAC8", background: showOverlay ? "#1A4A35" : "#F5F0E8", color: showOverlay ? "#fff" : "#6B6455", cursor:"pointer" }}
              >
                {showOverlay ? "Profit ✓" : "Profit"}
              </button>
            </div>
          </div>
          <div style={{ padding:"20px 22px 16px" }}>
            <BarChart
              revenueData={MONTHLY_REVENUE}
              expenseData={MONTHLY_EXPENSES}
              labels={MONTHS}
              height={200}
              sym={sym}
              showOverlay={showOverlay}
            />

            {/* Monthly surplus */}
            <div style={{ marginTop:16, padding:"12px 14px", background:"#F5F0E8", borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:11, color:"#6B6455" }}>July surplus</div>
                <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, color:"#1A4A35" }}>
                  {fmt(MONTHLY_REVENUE[6] - MONTHLY_EXPENSES[6], sym)}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"#6B6455" }}>Best month</div>
                <div style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:700, color:"#E8A020" }}>
                  {MONTHS[MONTHLY_REVENUE.indexOf(Math.max(...MONTHLY_REVENUE))]}
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Export reports */}
        <Panel>
          <div style={{ padding:"16px 22px", borderBottom:"1px solid #E2DAC8", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:700 }}>Export Reports</span>
            {exportMsg && (
              <span style={{ fontSize:11, color:"#1A6A40", fontWeight:600 }}>{exportMsg}</span>
            )}
          </div>
          <div style={{ padding:"18px 20px" }}>
            {EXPORT_REPORTS.map((r, i) => (
              <div
                key={i}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom: i < EXPORT_REPORTS.length - 1 ? "1px solid #F0EDE4" : "none", cursor:"pointer", borderRadius:8, paddingLeft:6 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F9F6EF")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <div style={{ width:38, height:38, borderRadius:9, background:r.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                  {r.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{r.label}</div>
                  <div style={{ fontSize:11, color:"#6B6455", marginTop:1 }}>{r.desc}</div>
                </div>
                <Btn variant="ghost" small>⬇ PDF</Btn>
              </div>
            ))}

            {/* Invoice CSV Export */}
            <div style={{ marginTop:14, padding:"13px 14px", background:"#F0F7F4", borderRadius:10, border:"1px solid #D4EDE3", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:12.5, fontWeight:600, color:"#1A4A35" }}>📥 Export Invoices (CSV)</div>
                <div style={{ fontSize:11, color:"#6B6455", marginTop:2 }}>{(invoices || []).length} invoices · all statuses</div>
              </div>
              <Btn variant="forest" small onClick={handleExport}>⬇ Download</Btn>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Invoice performance ── */}
      <Panel>
        <PanelHeader title="Invoice Payment Performance" />
        <div style={{ padding:"20px 22px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
          {[
            { label:"Avg Payment Time", val:"9 days",  sub:"↓ from 45 days",   icon:"⚡", color:"#1A4A35" },
            { label:"On-time Rate",     val:"74%",      sub:"+12% this month",  icon:"✅", color:"#1A7A50" },
            { label:"Online Payments",  val:"94%",      sub:"vs 6% cash",       icon:"💳", color:"#4AACB8" },
            { label:"Invoices Paid",    val:`${(invoices || []).filter(i=>i.status==="paid").length}/${(invoices||[]).length}`, sub:"this month", icon:"📄", color:"#E8A020" },
          ].map((s, i) => (
            <div key={i} style={{ padding:"16px 0", borderRight: i < 3 ? "1px solid #F0EDE4" : "none", paddingRight:16 }}>
              <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontSize:10.5, color:"#6B6455", textTransform:"uppercase", letterSpacing:".6px", marginBottom:4 }}>{s.label}</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:700, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:"#6B6455", marginTop:3 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </Panel>
      {/* ── Invoice Aging Report ── */}
      <InvoiceAgingPanel invoices={invoices || []} sym={sym} />
    </div>
  );
}

// ── Invoice Aging Panel ────────────────────────────────────────────────────────
function InvoiceAgingPanel({ invoices, sym }) {
  const today = new Date();
  const unpaid = invoices.filter((i) => i.status !== "paid" && i.due_date);

  const buckets = [
    { label: "0–30 days",  color: "#1A7A50", days: [0,  30]  },
    { label: "31–60 days", color: "#E8A020", days: [31, 60]  },
    { label: "61–90 days", color: "#C4522A", days: [61, 90]  },
    { label: "90+ days",   color: "#7A1A35", days: [91, Infinity] },
  ].map((b) => {
    const invs = unpaid.filter((inv) => {
      const diff = Math.floor((today - new Date(inv.due_date)) / 86400000);
      return diff >= b.days[0] && diff <= b.days[1];
    });
    return { ...b, count: invs.length, total: invs.reduce((a, i) => a + (i.total || 0), 0) };
  });

  const maxTotal = Math.max(...buckets.map((b) => b.total), 1);

  return (
    <Panel style={{ marginTop: 20 }}>
      <PanelHeader title="📅 Invoice Aging Report" />
      <div style={{ padding: "20px 22px" }}>
        <div style={{ fontSize: 12, color: "#6B6455", marginBottom: 16 }}>
          Outstanding invoices bucketed by how overdue they are
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {buckets.map((b) => (
            <div key={b.label} style={{ padding: "14px 16px", background: "#F9F6EF", borderRadius: 12, borderTop: `3px solid ${b.color}` }}>
              <div style={{ fontSize: 10.5, color: "#6B6455", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>{b.label}</div>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 700, color: b.color }}>{fmt(b.total, sym)}</div>
              <div style={{ fontSize: 11.5, color: "#6B6455", marginTop: 3 }}>{b.count} invoice{b.count !== 1 ? "s" : ""}</div>
            </div>
          ))}
        </div>
        {buckets.map((b) => (
          <div key={b.label} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#6B6455" }}>{b.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(b.total, sym)}</span>
            </div>
            <div style={{ height: 8, background: "#E2DAC8", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(b.total / maxTotal) * 100}%`, background: b.color, borderRadius: 4, transition: "width .6s ease" }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
