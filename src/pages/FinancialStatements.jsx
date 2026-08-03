/**
 * SmartInvoice Africa — Financial Statements Page
 * Real double-entry statements derived from invoices + expenses:
 *   Profit & Loss · Balance Sheet · Cash Flow
 */

import { useState, useEffect } from "react";
import { Btn, Panel } from "../components/UI.jsx";
import { fetchInvoices } from "../services/invoiceService.js";
import { fetchExpenses } from "../services/expenseService.js";
import {
  buildLedger,
  computeProfitAndLoss,
  computeBalanceSheet,
  computeCashFlow,
  formatNumber,
} from "../lib/ledger.js";

const PERIODS = [
  { id: "this-month",  label: "This Month" },
  { id: "this-quarter", label: "This Quarter" },
  { id: "this-year",   label: "This Year" },
  { id: "all-time",    label: "All Time" },
];

const TABS = [
  { id: "pnl",   label: "Profit & Loss" },
  { id: "balance", label: "Balance Sheet" },
  { id: "cashflow", label: "Cash Flow" },
];

function periodRange(id) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const fromMap = {
    "this-month": new Date(y, m, 1),
    "this-quarter": new Date(y, m - (m % 3), 1),
    "this-year": new Date(y, 0, 1),
  };
  const from = fromMap[id];
  return from
    ? { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) }
    : { from: undefined, to: undefined };
}

export default function FinancialStatements({ currency }) {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pnl");
  const [period, setPeriod] = useState("this-year");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchInvoices(), fetchExpenses()])
      .then(([inv, exp]) => {
        if (cancelled) return;
        setInvoices(inv || []);
        setExpenses(exp || []);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load data");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = buildLedger(invoices, expenses);
  const range = periodRange(period);

  if (loading) {
    return <div className="page-content" style={{ fontSize: 13, color: "#6B6455" }}>Loading statements…</div>;
  }
  if (error) {
    return <div className="page-content" style={{ fontSize: 13, color: "#C4522A" }}>{error}</div>;
  }

  return (
    <div className="page-content">
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 22, fontWeight: 800 }}>Financial Statements</div>
          <div style={{ fontSize: 12, color: "#6B6455", marginTop: 3 }}>
            Generated from {invoices.length} invoices &amp; {expenses.length} expenses · double-entry GL
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {TABS.map((t) => (
            <Btn key={t.id} small variant={tab === t.id ? "forest" : "ghost"} onClick={() => setTab(t.id)}>
              {t.label}
            </Btn>
          ))}
          <select
            className="field-input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: 140, marginBottom: 0, cursor: "pointer" }}
          >
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {tab === "pnl" && <ProfitAndLoss entries={entries} range={range} currency={currency} />}
      {tab === "balance" && <BalanceSheet entries={entries} currency={currency} />}
      {tab === "cashflow" && <CashFlow entries={entries} range={range} currency={currency} />}
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────
function fmt(n, currency) {
  return formatNumber(n, currency);
}

function StatementRow({ code, name, amount, depth = 0, bold = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: "1px solid #F0EDE4",
        paddingLeft: depth * 16,
        fontWeight: bold ? 700 : 400,
        fontFamily: bold ? "Syne, sans-serif" : "DM Sans, sans-serif",
      }}
    >
      <span style={{ fontSize: bold ? 13.5 : 13, color: bold ? "#0D0D0D" : "#3a352c" }}>
        {code && !bold && (
          <span style={{ color: "#B9B0A0", fontSize: 11, marginRight: 8 }}>{code}</span>
        )}
        {name}
      </span>
      <span style={{ fontSize: bold ? 14 : 13, color: bold ? "#1A4A35" : "#0D0D0D" }}>{fmt(amount, "")}</span>
    </div>
  );
}

// ── Profit & Loss ─────────────────────────────────────────────────────────────
function ProfitAndLoss({ entries, range, currency }) {
  const pnl = computeProfitAndLoss(entries, range);

  return (
    <Panel>
      <div style={{ padding: "18px 22px", borderBottom: "1px solid #E2DAC8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 700 }}>📈 Profit &amp; Loss</span>
        <span style={{ fontSize: 11, color: "#6B6455" }}>{range.from ?? "Since start"} → {range.to ?? "today"}</span>
      </div>
      <div style={{ padding: "18px 22px" }}>
        <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, color: "#6B6455", marginBottom: 6 }}>Revenue</div>
        {pnl.revenue.length === 0 && <div style={{ fontSize: 12, color: "#B9B0A0", padding: "6px 0" }}>No revenue this period</div>}
        {pnl.revenue.map((r) => (
          <StatementRow key={r.code} code={r.code} name={r.name} amount={r.amount} />
        ))}
        <StatementRow name="Total Revenue" amount={pnl.totalRevenue} bold />

        <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, color: "#6B6455", margin: "18px 0 6px" }}>Expenses</div>
        {pnl.expenses.length === 0 && <div style={{ fontSize: 12, color: "#B9B0A0", padding: "6px 0" }}>No expenses this period</div>}
        {pnl.expenses.map((e) => (
          <StatementRow key={e.code} code={e.code} name={e.name} amount={e.amount} />
        ))}
        <StatementRow name="Total Expenses" amount={pnl.totalExpenses} bold />

        <div style={{ marginTop: 18, padding: "14px 16px", background: pnl.netProfit >= 0 ? "#D4EDE3" : "#FAE0D5", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "Syne,sans-serif", fontSize: 14, fontWeight: 700, color: "#1A4A35" }}>
            Net {pnl.netProfit >= 0 ? "Profit" : "Loss"}
          </span>
          <span style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 800, color: pnl.netProfit >= 0 ? "#1A7A50" : "#C4522A" }}>
            {fmt(pnl.netProfit, currency)}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#6B6455", marginTop: 10 }}>
          Gross margin: {pnl.totalRevenue > 0 ? Math.round((pnl.netProfit / pnl.totalRevenue) * 100) : 0}%
        </div>
      </div>
    </Panel>
  );
}

// ── Balance Sheet ─────────────────────────────────────────────────────────────
function BalanceSheet({ entries, currency }) {
  const bs = computeBalanceSheet(entries);

  return (
    <Panel>
      <div style={{ padding: "18px 22px", borderBottom: "1px solid #E2DAC8" }}>
        <span style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 700 }}>⚖️ Balance Sheet</span>
        <span style={{ display: "block", fontSize: 11, color: "#6B6455", marginTop: 3 }}>
          {bs.balanced ? "✓ Balanced — assets equal liabilities plus equity" : "⚠ Statement out of balance"}
        </span>
      </div>
      <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, color: "#6B6455", marginBottom: 6 }}>Assets</div>
          {bs.assets.map((a) => (
            <StatementRow key={a.code} code={a.code} name={a.name} amount={a.amount} />
          ))}
          <StatementRow name="Total Assets" amount={bs.totalAssets} bold />
        </div>
        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, color: "#6B6455", marginBottom: 6 }}>Liabilities</div>
          {bs.liabilities.map((l) => (
            <StatementRow key={l.code} code={l.code} name={l.name} amount={l.amount} />
          ))}
          <StatementRow name="Total Liabilities" amount={bs.totalLiabilities} bold />
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, color: "#6B6455", margin: "18px 0 6px" }}>Equity</div>
          {bs.equity.map((e) => (
            <StatementRow key={e.code} code={e.code} name={e.name} amount={e.amount} />
          ))}
          <StatementRow name="Total Equity" amount={bs.totalEquity} bold />
        </div>
      </div>
    </Panel>
  );
}

// ── Cash Flow ─────────────────────────────────────────────────────────────────
function CashFlow({ entries, range, currency }) {
  const cf = computeCashFlow(entries, range);

  return (
    <Panel>
      <div style={{ padding: "18px 22px", borderBottom: "1px solid #E2DAC8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 700 }}>💵 Cash Flow</span>
        <span style={{ fontSize: 11, color: "#6B6455" }}>{range.from ?? "Since start"} → {range.to ?? "today"}</span>
      </div>
      <div style={{ padding: "18px 22px" }}>
        <div className="grid-3" style={{ marginBottom: 18 }}>
          {[
            { label: "Operating inflows",  val: cf.totalInflows,  color: "#1A7A50" },
            { label: "Operating outflows", val: cf.totalOutflows, color: "#C4522A" },
            { label: "Net cash flow",      val: cf.netOperatingCashFlow, color: cf.netOperatingCashFlow >= 0 ? "#1A4A35" : "#993A1A" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#F9F6EF", borderRadius: 12, padding: "14px 16px", borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 10.5, color: "#6B6455", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 700, color: s.color }}>{fmt(s.val, currency)}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, color: "#6B6455", marginBottom: 6 }}>Operating transactions</div>
        {cf.operating.length === 0 && (
          <div style={{ fontSize: 12, color: "#B9B0A0", padding: "8px 0" }}>No cash movement this period</div>
        )}
        {cf.operating.map((o, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #F0EDE4" }}>
            <div>
              <div style={{ fontSize: 13 }}>{o.description}</div>
              <div style={{ fontSize: 11, color: "#B9B0A0" }}>{o.date}</div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: o.net >= 0 ? "#1A7A50" : "#C4522A" }}>
              {o.net >= 0 ? "+" : ""}{fmt(o.net, currency)}
            </span>
          </div>
        ))}

        <div style={{ marginTop: 18, padding: "14px 16px", background: "#D4EDE3", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "Syne,sans-serif", fontSize: 14, fontWeight: 700, color: "#1A4A35" }}>Net change in cash</span>
          <span style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 800, color: cf.netCashFlow >= 0 ? "#1A7A50" : "#C4522A" }}>
            {cf.netCashFlow >= 0 ? "+" : ""}{fmt(cf.netCashFlow, currency)}
          </span>
        </div>
      </div>
    </Panel>
  );
}
