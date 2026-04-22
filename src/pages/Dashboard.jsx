/**
 * SmartInvoice Africa — Dashboard Page
 * Enhanced with statistical analysis, health score, and sparklines
 */

import { Avatar, Badge, Btn, Panel, PanelHeader, StatCard, RealtimeStatus } from "../components/UI.jsx";
import { ACTIVITY, fmt, currencySymbol, MONTHLY_REVENUE, MONTHLY_EXPENSES } from "../data/mockData.js";
import { useRealtimeInvoices } from "../hooks/useRealtimeInvoices.js";
import { useStatisticalAnalysis } from "../hooks/useStatisticalAnalysis.js";
import { descriptiveStats, growthRate, analyzeTrend } from "../lib/statistics.js";
import { Sparkline } from "../components/MiniChart.jsx";
import { computeHealthScore } from "../lib/healthScore.js";
import { getDueDateStatus } from "../hooks/useDueDateStatus.js";

export default function Dashboard({ setPage, currency, invoices, setInvoices, expenses = [] }) {
  const sym         = currencySymbol(currency);
  const receivables = invoices.filter((i) => i.status !== "paid").reduce((a, b) => a + b.amount, 0);
  const paidAmt     = invoices.filter((i) => i.status === "paid").reduce((a, b) => a + b.amount, 0);
  const overdueCnt  = invoices.filter((i) => i.status === "overdue").length;

  // Statistical analysis
  const stats = useStatisticalAnalysis(invoices, expenses, MONTHLY_REVENUE, MONTHLY_EXPENSES);
  
  // Enable realtime updates if setInvoices is provided
  const realtime = setInvoices ? useRealtimeInvoices(setInvoices) : { connectionStatus: "SUBSCRIBED", lastUpdate: null, updateCount: 0 };

  const health = computeHealthScore({ invoices, expenses, monthlyRevenue: MONTHLY_REVENUE, monthlyExpenses: MONTHLY_EXPENSES });

  return (
    <div className="page-content">
      {/* ── Hero strip ── */}
      <HeroStrip
        sym={sym}
        receivables={receivables}
        invoices={invoices}
        setPage={setPage}
        realtime={realtime}
      />

      {/* ── Business Health Score ── */}
      <HealthScorePanel health={health} sym={sym} />

      {/* ── Metric cards ── */}
      <div className="grid-4" style={{ marginBottom: 22 }}>
        <StatCard 
          icon="📥" 
          label="Revenue · Jul"    
          value={fmt(paidAmt, sym)}     
          trend={`▲ ${stats.revenueTrend.growth.toFixed(1)}% vs last month`}      
          trendColor="#1A7A50" 
          accent="#E8A020" 
        />
        <StatCard 
          icon="⏰" 
          label="Overdue Invoices" 
          value={fmt(invoices.filter(i=>i.status==="overdue").reduce((a,b)=>a+b.amount,0),sym)} 
          trend={`▼ ${overdueCnt} overdue (${stats.invoiceAnalysis.overdueRate.toFixed(1)}%)`} 
          trendColor="#C4522A" 
          accent="#C4522A" 
        />
        <StatCard 
          icon="📊" 
          label="Avg Invoice"   
          value={fmt(stats.invoiceAnalysis.median, sym)}      
          trend={`σ ${stats.invoiceAnalysis.stdDev.toLocaleString('en-NG', { maximumFractionDigits: 0 })} std dev`}          
          trendColor="#4AACB8" 
          accent="#1A4A35" 
        />
        <StatCard 
          icon="💰" 
          label="Net Profit · Jul" 
          value={fmt(stats.profitability.monthlyProfits[6] || 0, sym)}       
          trend={`${stats.profitability.margin.toFixed(1)}% margin`}          
          trendColor="#1A7A50" 
          accent="#1A7A50" 
        />
      </div>

      {/* ── Two-column row ── */}
      <div className="grid-2-wide" style={{ marginBottom: 18 }}>
        <RecentInvoices sym={sym} invoices={invoices} setPage={setPage} overdueCnt={overdueCnt} />
        <CashFlowPanel sym={sym} receivables={receivables} invoices={invoices} setPage={setPage} />
      </div>

      {/* ── Statistical Insights ── */}
      <StatisticalInsightsPanel 
        sym={sym} 
        stats={stats} 
        invoices={invoices}
        expenses={expenses}
      />

      {/* ── Activity feed ── */}
      <ActivityPanel />
    </div>
  );
}

// ── Hero Strip ────────────────────────────────────────────────────────────────
function HeroStrip({ sym, receivables, invoices, setPage, realtime }) {
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
          Adejumo Aderinsola 👋
        </div>
        <div style={{ display:"flex", gap:22, flexWrap:"wrap", alignItems:"center", marginBottom: 16 }}>
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
        {/* Revenue Sparkline */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:10, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:1 }}>7-Month Revenue</span>
          <Sparkline data={MONTHLY_REVENUE} color="#E8A020" height={32} width={110} filled />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex", flexDirection:"column", gap:8, position:"relative", alignItems: "flex-end" }}>
        <RealtimeStatus connectionStatus={realtime.connectionStatus} lastUpdate={realtime.lastUpdate} updateCount={realtime.updateCount} showDetails />
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
          {invoices.filter((i) => i.status !== "paid").slice(0, 3).map((inv, idx) => {
            const dueDate = inv.due_date || inv.due;
            const ds = getDueDateStatus(dueDate, inv.status);
            return (
              <div key={inv.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 0", borderBottom:"1px solid #F0EDE4" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background: idx===0 ? "#C4522A" : idx===1 ? "#E8A020" : "#1A7A50", flexShrink:0 }} />
                <span style={{ fontSize:12.5, flex:1 }}>{inv.customer_name || inv.client}</span>
                <span style={{ fontSize:10, padding:"2px 7px", borderRadius:6, background:ds.bg, color:ds.color, fontWeight:600 }}>{ds.label}</span>
                <span style={{ fontFamily:"Syne,sans-serif", fontSize:12.5, fontWeight:700, color: idx===0 ? "#C4522A" : idx===1 ? "#E8A020" : "#1A7A50" }}>{fmt(inv.total || inv.amount, sym)}</span>
              </div>
            );
          })}
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

// ── Business Health Score Panel ────────────────────────────────────────────────
function HealthScorePanel({ health, sym }) {
  const { score, grade, gradeColor, gradeBg, factors, actions } = health;

  // SVG arc gauge
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const progress = (score / 100) * circ;
  const scoreColor = score >= 80 ? "#1A7A50" : score >= 60 ? "#E8A020" : "#C4522A";

  return (
    <Panel style={{ marginBottom: 22 }}>
      <div style={{ padding: "18px 22px 20px" }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>

          {/* Gauge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#6B6455", marginBottom: 8 }}>
              Business Health
            </div>
            <svg width={110} height={80} viewBox="0 0 110 80">
              {/* Background arc */}
              <circle cx={55} cy={60} r={radius} fill="none" stroke="#E2DAC8" strokeWidth={10}
                strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
                strokeDashoffset={circ * 0.375}
                strokeLinecap="round"
              />
              {/* Foreground arc */}
              <circle cx={55} cy={60} r={radius} fill="none" stroke={scoreColor} strokeWidth={10}
                strokeDasharray={`${progress * 0.75} ${circ - progress * 0.75}`}
                strokeDashoffset={circ * 0.375}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray .8s ease" }}
              />
              {/* Score text */}
              <text x={55} y={55} textAnchor="middle" fill={scoreColor}
                fontSize={24} fontWeight={800} fontFamily="Syne, sans-serif">
                {score}
              </text>
              <text x={55} y={68} textAnchor="middle" fill="#6B6455" fontSize={10}>
                /100
              </text>
            </svg>
            <span style={{
              fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 800,
              background: gradeBg, color: gradeColor,
              padding: "2px 12px", borderRadius: 8, marginTop: 4,
            }}>
              Grade {grade}
            </span>
          </div>

          {/* Factor bars */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#6B6455", marginBottom: 10 }}>
              Score Breakdown
            </div>
            {factors.map((f) => {
              const pct = (f.score / f.max) * 100;
              const barColor = f.status === "good" ? "#1A7A50" : f.status === "warning" ? "#E8A020" : "#C4522A";
              return (
                <div key={f.name} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11.5, color: "#1A4A35" }}>{f.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>
                      {f.score}/{f.max} · {f.value}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#E2DAC8", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`, background: barColor,
                      borderRadius: 3, transition: "width .6s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Priority actions */}
          {actions.length > 0 && (
            <div style={{ minWidth: 200, maxWidth: 260 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#6B6455", marginBottom: 10 }}>
                🎯 Priority Actions
              </div>
              {actions.map((action, i) => (
                <div key={i} style={{
                  padding: "9px 12px", borderRadius: 8, marginBottom: 8,
                  background: i === 0 ? "#FAE0D5" : "#FFF4D6",
                  border: `1px solid ${i === 0 ? "#F5C4B0" : "#F5E0A0"}`,
                  fontSize: 11.5, color: "#1A4A35", lineHeight: 1.5,
                }}>
                  {i === 0 ? "🔴" : i === 1 ? "🟡" : "🟢"} {action}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}


function StatisticalInsightsPanel({ sym, stats, invoices, expenses }) {
  const { invoiceAnalysis, expenseAnalysis, revenueTrend, expenseTrend, profitability, correlationAnalysis } = stats;
  
  return (
    <Panel>
      <PanelHeader title="📊 Statistical Insights" />
      <div style={{ padding:"20px 22px" }}>
        {/* Row 1: Invoice & Expense Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:16 }}>
          {/* Invoice Statistics */}
          <div style={{ padding:16, background:"#F9F6EF", borderRadius:12 }}>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:1, color:"#6B6455", marginBottom:12 }}>📄 Invoice Analysis</div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:"#6B6455" }}>Average Invoice</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, color:"#1A4A35" }}>
                {fmt(invoiceAnalysis.mean, sym)}
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:"#6B6455" }}>Median Invoice</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, color:"#1A7A50" }}>
                {fmt(invoiceAnalysis.median, sym)}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:"#6B6455" }}>Collection Rate</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, color:invoiceAnalysis.collectionRatio > 0.7 ? "#1A7A50" : "#C4522A" }}>
                {(invoiceAnalysis.collectionRatio * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Expense Statistics */}
          <div style={{ padding:16, background:"#FFF4F0", borderRadius:12 }}>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:1, color:"#6B6455", marginBottom:12 }}>🧾 Expense Analysis</div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:"#6B6455" }}>Average Expense</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, color:"#C4522A" }}>
                {fmt(expenseAnalysis.mean, sym)}
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:"#6B6455" }}>Highest Expense</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, color:"#C4522A" }}>
                {fmt(expenseAnalysis.max, sym)}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:"#6B6455" }}>Expense Categories</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, color:"#1A4A35" }}>
                {expenseAnalysis.byCategory.categoryCount} categories
              </div>
            </div>
          </div>

          {/* Profitability Stats */}
          <div style={{ padding:16, background:"#F0F7F4", borderRadius:12 }}>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:1, color:"#6B6455", marginBottom:12 }}>💰 Profitability</div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:"#6B6455" }}>Profit Margin</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, color:profitability.margin > 20 ? "#1A7A50" : profitability.margin > 10 ? "#E8A020" : "#C4522A" }}>
                {profitability.margin.toFixed(1)}%
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:"#6B6455" }}>Avg Monthly Profit</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, color:"#1A7A50" }}>
                {fmt(profitability.averageMonthlyProfit, sym)}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:"#6B6455" }}>Profit Trend</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, color:profitability.profitTrend.direction === 'increasing' ? "#1A7A50" : "#C4522A" }}>
                {profitability.profitTrend.direction === 'increasing' ? '📈' : profitability.profitTrend.direction === 'decreasing' ? '📉' : '➡️'} {profitability.profitTrend.strength.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Trend Analysis & Correlation */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
          {/* Trend Analysis */}
          <div style={{ padding:16, background:"#F8F4F0", borderRadius:12 }}>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:1, color:"#6B6455", marginBottom:14 }}>📈 Trend Analysis</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"#1A4A35", marginBottom:8 }}>Revenue Trend</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:16 }}>
                    {revenueTrend.direction === 'increasing' ? '📈' : revenueTrend.direction === 'decreasing' ? '📉' : '➡️'}
                  </span>
                  <span style={{ fontSize:13, color:"#6B6455" }}>
                    {revenueTrend.direction} at {revenueTrend.strength.toFixed(1)}%/period
                  </span>
                </div>
                <div style={{ fontSize:11, color:"#6B6455" }}>
                  3-period moving avg: {fmt(revenueTrend.movingAverage[revenueTrend.movingAverage.length - 1] || 0, sym)}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"#C4522A", marginBottom:8 }}>Expense Trend</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:16 }}>
                    {expenseTrend.direction === 'increasing' ? '📈' : expenseTrend.direction === 'decreasing' ? '📉' : '➡️'}
                  </span>
                  <span style={{ fontSize:13, color:"#6B6455" }}>
                    {expenseTrend.direction} at {expenseTrend.strength.toFixed(1)}%/period
                  </span>
                </div>
                <div style={{ fontSize:11, color:"#6B6455" }}>
                  3-period moving avg: {fmt(expenseTrend.movingAverage[expenseTrend.movingAverage.length - 1] || 0, sym)}
                </div>
              </div>
            </div>

            {/* Growth comparison */}
            <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #E8E0D0" }}>
              <div style={{ fontSize:11, color:"#6B6455", marginBottom:8 }}>Month-over-Month Growth</div>
              <div style={{ display:"flex", gap:20 }}>
                <div>
                  <span style={{ fontSize:11, color:"#1A4A35" }}>Revenue: </span>
                  <span style={{ fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:700, color:revenueTrend.growth > 0 ? "#1A7A50" : "#C4522A" }}>
                    {revenueTrend.growth > 0 ? '▲' : '▼'} {Math.abs(revenueTrend.growth).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span style={{ fontSize:11, color:"#C4522A" }}>Expenses: </span>
                  <span style={{ fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:700, color:expenseTrend.growth > 0 ? "#C4522A" : "#1A7A50" }}>
                    {expenseTrend.growth > 0 ? '▲' : '▼'} {Math.abs(expenseTrend.growth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Correlation & Distribution */}
          <div style={{ padding:16, background:"#F4F0F8", borderRadius:12 }}>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:1, color:"#6B6455", marginBottom:14 }}>🔗 Correlation</div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#6B6455", marginBottom:6 }}>Revenue vs Expenses</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:24, fontWeight:800, color:Math.abs(correlationAnalysis.coefficient) > 0.7 ? "#1A4A35" : "#5A3A8A" }}>
                {correlationAnalysis.coefficient.toFixed(3)}
              </div>
              <div style={{ fontSize:11, color:"#6B6455", marginTop:4 }}>
                {correlationAnalysis.strength} {correlationAnalysis.relationship} correlation
              </div>
            </div>

            {/* Top expense categories */}
            <div>
              <div style={{ fontSize:11, color:"#6B6455", marginBottom:8 }}>Top Expense Categories</div>
              {Object.entries(expenseAnalysis.byCategory.distribution)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 3)
                .map(([cat, data], idx) => (
                  <div key={cat} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background: idx === 0 ? "#C4522A" : idx === 1 ? "#E8A020" : "#4AACB8" }} />
                    <span style={{ fontSize:11, flex:1, color:"#6B6455" }}>{cat}</span>
                    <span style={{ fontSize:11, fontWeight:600, color:"#1A4A35" }}>{data.percentage.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Variability Metrics */}
        <div style={{ marginTop:16, padding:"14px 16px", background:"#F0F4F8", borderRadius:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", gap:24 }}>
            <div>
              <div style={{ fontSize:10, color:"#6B6455", textTransform:"uppercase" }}>Revenue Std Dev</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:700, color:"#1A4A35" }}>
                {fmt(stats.revenueTrend.stdDev || 0, sym)}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#6B6455", textTransform:"uppercase" }}>Expense Variability</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:700, color:"#C4522A" }}>
                {fmt(expenseAnalysis.stdDev, sym)}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#6B6455", textTransform:"uppercase" }}>Invoice Range</div>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:700, color:"#5A3A8A" }}>
                {fmt(invoiceAnalysis.min, sym)} - {fmt(invoiceAnalysis.max, sym)}
              </div>
            </div>
          </div>
          <div style={{ fontSize:11, color:"#6B6455", fontStyle:"italic" }}>
            σ Measures volatility and risk
          </div>
        </div>
      </div>
    </Panel>
  );
}
