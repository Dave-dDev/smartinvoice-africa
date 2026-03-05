/**
 * SmartInvoice Africa — Dashboard Page
 */

import { Avatar, Badge, Btn, Panel, PanelHeader, StatCard } from "../components/UI.jsx";
import { ACTIVITY, fmt, currencySymbol } from "../data/mockData.js";

export default function Dashboard({ setPage, currency, invoices }) {
  const sym         = currencySymbol(currency);
  const receivables = invoices.filter((i) => i.status !== "paid").reduce((a, b) => a + b.amount, 0);
  const paidAmt     = invoices.filter((i) => i.status === "paid").reduce((a, b) => a + b.amount, 0);
  const overdueCnt  = invoices.filter((i) => i.status === "overdue").length;

  return (
    <div className="page-content">
      {/* ── Hero strip ── */}
      <HeroStrip
        sym={sym}
        receivables={receivables}
        invoices={invoices}
        setPage={setPage}
      />

      {/* ── Metric cards ── */}
      <div className="grid-4" style={{ marginBottom: 22 }}>
        <StatCard icon="📥" label="Revenue · Jul"    value={fmt(paidAmt, sym)}     trend="▲ +23% vs last month"      trendColor="#1A7A50" accent="#E8A020" />
        <StatCard icon="⏰" label="Overdue Invoices" value={fmt(invoices.filter(i=>i.status==="overdue").reduce((a,b)=>a+b.amount,0),sym)} trend={`▼ ${overdueCnt} overdue`} trendColor="#C4522A" accent="#C4522A" />
        <StatCard icon="🧾" label="Total Expenses"   value={fmt(2930000, sym)}      trend="▲ +8% from budget"          trendColor="#C4522A" accent="#1A4A35" />
        <StatCard icon="🏦" label="VAT Liability Q3" value={fmt(930000, sym)}       trend="Due Sep 21 · 7.5%"          trendColor="#4AACB8" accent="#4AACB8" />
      </div>

      {/* ── Two-column row ── */}
      <div className="grid-2-wide" style={{ marginBottom: 18 }}>
        <RecentInvoices sym={sym} invoices={invoices} setPage={setPage} overdueCnt={overdueCnt} />
        <CashFlowPanel sym={sym} receivables={receivables} invoices={invoices} setPage={setPage} />
      </div>

      {/* ── Activity feed ── */}
      <ActivityPanel />
    </div>
  );
}

// ── Hero Strip ────────────────────────────────────────────────────────────────
function HeroStrip({ sym, receivables, invoices, setPage }) {
  return (
    <div
      className="fade-up"
      style={{
        background: "#1A4A35",
        borderRadius: 16,
        padding: "24px 28px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 20,
        marginBottom: 22,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative orbs */}
      <div style={{ position:"absolute", right:-40, top:-60, width:250, height:250, borderRadius:"50%", background:"rgba(232,160,32,.1)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", right:80,  bottom:-80, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,.04)", pointerEvents:"none" }} />

      {/* Stats */}
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 3 }}>Good morning,</div>
        <div style={{ fontFamily:"Syne,sans-serif", fontSize:21, fontWeight:700, color:"#fff", marginBottom:12 }}>
          Adeola Okonkwo 👋
        </div>
        <div style={{ display:"flex", gap:22, flexWrap:"wrap" }}>
          {[
            { val: fmt(receivables, sym),                                               label: "Outstanding receivables" },
            { val: `${invoices.filter((i) => i.status !== "paid").length} invoices`,    label: "Awaiting payment"        },
            { val: "9 days",                                                            label: "Avg payment time ↓ from 45" },
          ].map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:20 }}>
              {i > 0 && <div style={{ width:1, height:38, background:"rgba(255,255,255,.12)" }} />}
              <div>
                <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:700, color:"#F5C44A" }}>{s.val}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", marginTop:2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex", flexDirection:"column", gap:8, position:"relative" }}>
        <Btn variant="gold" onClick={() => setPage("invoices")}>＋ New Invoice</Btn>
        <Btn variant="outline" style={{ borderColor:"rgba(255,255,255,.3)", color:"rgba(255,255,255,.85)", background:"rgba(255,255,255,.08)" }}>
          📤 Share via WhatsApp
        </Btn>
      </div>
    </div>
  );
}

// ── Recent Invoices Panel ─────────────────────────────────────────────────────
function RecentInvoices({ sym, invoices, setPage, overdueCnt }) {
  return (
    <Panel>
      <PanelHeader title="Recent Invoices" action="View all →" onAction={() => setPage("invoices")} />
      {invoices.slice(0, 5).map((inv) => (
        <div
          key={inv.id}
          style={{ display:"grid", gridTemplateColumns:"auto 1fr auto auto", alignItems:"center", gap:11, padding:"12px 20px", borderBottom:"1px solid #F0EDE4", cursor:"pointer", transition:"background .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F0E8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
        >
          <Avatar initials={inv.initials} color={inv.color} size={34} />
          <div>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{inv.client}</div>
            <div style={{ fontSize:11, color:"#6B6455" }}>{inv.id} · Due {inv.due}</div>
          </div>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:13.5, fontWeight:700 }}>{fmt(inv.amount, sym)}</div>
          <Badge status={inv.status} />
        </div>
      ))}

      {/* WhatsApp CTA */}
      {overdueCnt > 0 && (
        <div style={{ margin:"10px 14px 14px", background:"linear-gradient(135deg,#25D366,#128C7E)", borderRadius:10, padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18 }}>💬</span>
            <div style={{ color:"#fff" }}>
              <div style={{ fontSize:12.5, fontWeight:600 }}>Send overdue reminders via WhatsApp</div>
              <div style={{ fontSize:11, opacity:.8 }}>{overdueCnt} customers haven't paid</div>
            </div>
          </div>
          <Btn variant="white" small>Send Now</Btn>
        </div>
      )}
    </Panel>
  );
}

// ── Cash Flow Panel ───────────────────────────────────────────────────────────
function CashFlowPanel({ sym, receivables, invoices, setPage }) {
  const payables = 1150000;

  return (
    <Panel>
      <PanelHeader title="Cash Flow Snapshot" action="Full report" onAction={() => setPage("reports")} />
      <div style={{ padding:"18px 20px" }}>
        {[
          { label:"💚 Receivables", val:receivables, pct:82, fillA:"#1A7A50", fillB:"#4AB880", color:"#1A7A50" },
          { label:"🔴 Payables",    val:payables,    pct:20, fillA:"#C4522A", fillB:"#E87050", color:"#C4522A" },
        ].map((cf) => (
          <div key={cf.label} style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
              <span style={{ fontSize:12, color:"#6B6455" }}>{cf.label}</span>
              <span style={{ fontFamily:"Syne,sans-serif", fontSize:14.5, fontWeight:700, color:cf.color }}>{fmt(cf.val, sym)}</span>
            </div>
            <div style={{ height:8, background:"#E2DAC8", borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${cf.pct}%`, background:`linear-gradient(90deg,${cf.fillA},${cf.fillB})`, borderRadius:4, transition:"width .6s ease" }} />
            </div>
          </div>
        ))}

        {/* Net */}
        <div style={{ marginTop:14, padding:"12px 14px", background:"#F5F0E8", borderRadius:10, border:"1px solid #E2DAC8", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, fontWeight:500, color:"#6B6455" }}>Net Working Capital</span>
          <span style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:800, color:"#1A4A35" }}>{fmt(receivables - payables, sym)}</span>
        </div>

        {/* Top debtors */}
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1, color:"#6B6455", marginBottom:9 }}>Top Debtors</div>
          {invoices.filter((i) => i.status !== "paid").slice(0, 3).map((inv, idx) => (
            <div key={inv.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 0", borderBottom:"1px solid #F0EDE4" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background: idx===0 ? "#C4522A" : idx===1 ? "#E8A020" : "#1A7A50", flexShrink:0 }} />
              <span style={{ fontSize:12.5, flex:1 }}>{inv.client}</span>
              <span style={{ fontSize:11, color:"#6B6455" }}>{inv.due}</span>
              <span style={{ fontFamily:"Syne,sans-serif", fontSize:12.5, fontWeight:700, color: idx===0 ? "#C4522A" : idx===1 ? "#E8A020" : "#1A7A50" }}>{fmt(inv.amount, sym)}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ── Activity Panel ────────────────────────────────────────────────────────────
function ActivityPanel() {
  return (
    <Panel>
      <PanelHeader title="Recent Activity" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)" }}>
        {ACTIVITY.map((a, i) => (
          <div
            key={i}
            style={{
              display:"flex", gap:11, padding:"13px 20px",
              borderRight:  i % 3 !== 2 ? "1px solid #F0EDE4" : "none",
              borderBottom: i < 3       ? "1px solid #F0EDE4" : "none",
            }}
          >
            <div style={{ width:32, height:32, borderRadius:8, background:a.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>
              {a.icon}
            </div>
            <div>
              <div style={{ fontSize:12.5 }}>{a.text}</div>
              <div style={{ fontSize:10.5, color:"#6B6455", marginTop:3 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
