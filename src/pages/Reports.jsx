/**
 * SmartInvoice Africa — Reports Page
 */

import { Btn, Panel, PanelHeader } from "../components/UI.jsx";
import { MONTHLY_REVENUE, MONTHLY_EXPENSES, MONTHS, fmt, currencySymbol } from "../data/mockData.js";

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
  const maxVal = Math.max(...MONTHLY_REVENUE);

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
        {/* Bar chart */}
        <Panel>
          <PanelHeader title="Revenue vs Expenses · 2025" />
          <div style={{ padding:"24px 22px" }}>
            {/* Legend */}
            <div style={{ display:"flex", gap:16, marginBottom:18 }}>
              {[["Revenue","#1A4A35"],["Expenses","#C4522A"]].map(([l, c]) => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:c }} />
                  <span style={{ fontSize:12, color:"#6B6455" }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Bars */}
            <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:180 }}>
              {MONTHS.map((m, i) => (
                <div key={m} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:148 }}>
                    <div
                      title={`Revenue: ${fmt(MONTHLY_REVENUE[i], sym)}`}
                      style={{ width:18, background:"#1A4A35", borderRadius:"4px 4px 0 0", height:`${(MONTHLY_REVENUE[i]/maxVal)*100}%`, transition:"height .5s ease", minHeight:4, cursor:"pointer" }}
                    />
                    <div
                      title={`Expenses: ${fmt(MONTHLY_EXPENSES[i], sym)}`}
                      style={{ width:18, background:"#C4522A", borderRadius:"4px 4px 0 0", height:`${(MONTHLY_EXPENSES[i]/maxVal)*100}%`, transition:"height .5s ease", minHeight:4, cursor:"pointer" }}
                    />
                  </div>
                  <span style={{ fontSize:10.5, color:"#6B6455" }}>{m}</span>
                </div>
              ))}
            </div>

            {/* Monthly surplus */}
            <div style={{ marginTop:20, padding:"12px 14px", background:"#F5F0E8", borderRadius:10 }}>
              <div style={{ fontSize:11, color:"#6B6455", marginBottom:6 }}>July surplus</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, color:"#1A4A35" }}>
                {fmt(MONTHLY_REVENUE[6] - MONTHLY_EXPENSES[6], sym)}
              </div>
            </div>
          </div>
        </Panel>

        {/* Export reports */}
        <Panel>
          <PanelHeader title="Export Reports" />
          <div style={{ padding:"18px 20px" }}>
            {EXPORT_REPORTS.map((r, i) => (
              <div
                key={i}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom: i < EXPORT_REPORTS.length - 1 ? "1px solid #F0EDE4" : "none", cursor:"pointer", transition:"background .15s", borderRadius:8, paddingLeft:6 }}
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
            { label:"Invoices Paid",    val:`${invoices.filter(i=>i.status==="paid").length}/${invoices.length}`, sub:"this month", icon:"📄", color:"#E8A020" },
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
    </div>
  );
}
