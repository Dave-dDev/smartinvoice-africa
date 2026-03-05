/**
 * SmartInvoice Africa — Expenses Page
 */

import { useState, useEffect } from "react";
import { Btn, Panel, PanelHeader, Modal, Input, Select } from "../components/UI.jsx";
import { EXPENSES_DATA, EXP_COLORS, fmt, currencySymbol } from "../data/mockData.js";
import { fetchExpenses, createExpense } from "../services/expenseService.js";

export default function Expenses({ currency }) {
  const sym = currencySymbol(currency);

  const [expenses,  setExpenses]  = useState(EXPENSES_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vendor:"", category:"Inventory", amount:"", date:"", notes:"" });

  // Load expenses on mount
  useEffect(() => {
    fetchExpenses()
      .then(setExpenses)
      .catch((e) => {
        console.error("Failed to load expenses:", e.message);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", "Inventory", "Transport", "Salaries", "Utilities", "Marketing", "Rent", "Other"];

  const filtered  = filterCat === "All" ? expenses : expenses.filter((e) => e.category === filterCat);
  const total     = filtered.reduce((a, b) => a + b.amount, 0);
  const catTotals = ["Inventory", "Transport", "Salaries", "Utilities", "Marketing", "Rent", "Other"].map((cat) => ({
    cat,
    color: EXP_COLORS[cat] || "#6B6455",
    total: expenses.filter((e) => e.category === cat).reduce((a, b) => a + b.amount, 0),
  }));
  const maxCat = Math.max(...catTotals.map((c) => c.total), 1);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleAdd = async () => {
    if (!form.vendor.trim() || !form.amount) {
      alert("Please fill in vendor and amount");
      return;
    }

    try {
      const newExpense = await createExpense({
        vendor: form.vendor,
        category: form.category,
        amount: parseFloat(form.amount) || 0,
        currency,
        date: form.date || new Date().toISOString().split('T')[0],
        notes: form.notes
      });
      setExpenses((prev) => [newExpense, ...prev]);
      setShowModal(false);
      setForm({ vendor:"", category:"Inventory", amount:"", date:"", notes:"" });
    } catch (e) {
      console.error("Failed to create expense:", e.message);
      setError(e.message);
    }
  };

  if (loading && expenses.length === 0) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading expenses…</div>;
  }

  return (
    <div className="page-content">
      {/* ── Toolbar ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <CategoryTabs active={filterCat} categories={categories} onChange={setFilterCat} />
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost">📸 Scan Receipt</Btn>
          <Btn variant="gold" onClick={() => setShowModal(true)}>＋ Add Expense</Btn>
        </div>
      </div>

      {/* ── Two columns ── */}
      <div className="grid-2-wide">
        {/* Table */}
        <Panel>
          <PanelHeader title={`Expenses · ${filterCat === "All" ? "All Categories" : filterCat}`} />
          <table className="data-table">
            <thead>
              <tr>
                {["Date","Vendor","Category","Amount","Receipt"].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr key={exp.id}>
                  <td style={{ fontSize:12.5, color:"#6B6455" }}>{exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : "—"}</td>
                  <td>
                    <div style={{ fontSize:13, fontWeight:500 }}>{exp.vendor}</div>
                    {exp.notes && <div style={{ fontSize:11, color:"#6B6455" }}>{exp.notes}</div>}
                  </td>
                  <td>
                    <span style={{ fontSize:11, padding:"3px 8px", borderRadius:6, background:`${EXP_COLORS[exp.category] || "#6B6455"}22`, color:EXP_COLORS[exp.category] || "#6B6455", fontWeight:600 }}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{ fontFamily:"Syne,sans-serif", fontSize:13.5, fontWeight:700 }}>{fmt(exp.amount, sym)}</td>
                  <td style={{ fontSize:13 }}>{exp.receipt_url ? "🧾" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:"12px 18px", background:"#F5F0E8", borderTop:"1px solid #E2DAC8", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:12.5, fontWeight:600, color:"#6B6455" }}>Total ({filtered.length} items)</span>
            <span style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:700 }}>{fmt(total, sym)}</span>
          </div>
        </Panel>

        {/* Category breakdown */}
        <Panel>
          <PanelHeader title="By Category" />
          <div style={{ padding:"18px 20px" }}>
            <div style={{ fontSize:11, color:"#6B6455", marginBottom:14 }}>Current period total</div>
            {catTotals.map(({ cat, color, total: t }) => (
              <div key={cat} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:color }} />
                    <span style={{ fontSize:13 }}>{cat}</span>
                  </div>
                  <span style={{ fontFamily:"Syne,sans-serif", fontSize:13, fontWeight:700 }}>{fmt(t, sym)}</span>
                </div>
                <div style={{ height:7, background:"#E2DAC8", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(t/maxCat)*100}%`, background:color, borderRadius:4, transition:"width .5s ease" }} />
                </div>
              </div>
            ))}

            {/* OCR callout */}
            <div style={{ marginTop:18, padding:14, background:"#F0FBF5", border:"1px solid #B8E6CF", borderRadius:10 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#1A4A35", marginBottom:3 }}>📸 OCR Receipt Scanner</div>
              <div style={{ fontSize:11.5, color:"#6B6455" }}>Snap a receipt and auto-fill expense details instantly</div>
              <Btn variant="forest" small style={{ marginTop:10 }}>Open Scanner</Btn>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Add Expense modal ── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Expense">
        <Input label="Vendor / Payee" value={form.vendor}   onChange={(e) => set("vendor",   e.target.value)} placeholder="e.g. Lagos Market Co." required />
        <Select label="Category"      value={form.category} onChange={(e) => set("category", e.target.value)} options={["Inventory", "Transport", "Salaries", "Utilities", "Marketing", "Rent", "Other"]} />
        <Input label="Amount"         value={form.amount}   onChange={(e) => set("amount",   e.target.value)} type="number" placeholder="0.00" required />
        <Input label="Date"           value={form.date}     onChange={(e) => set("date",     e.target.value)} type="date" />
        <Input label="Notes"          value={form.notes}    onChange={(e) => set("notes",    e.target.value)} placeholder="Optional notes" />
        <Btn variant="forest" onClick={handleAdd} style={{ width:"100%", justifyContent:"center" }}>✅ Save Expense</Btn>
      </Modal>
    </div>
  );
}

// ── Category Tabs ─────────────────────────────────────────────────────────────
function CategoryTabs({ active, categories, onChange }) {
  return (
    <div style={{ display:"flex", background:"#FDFAF4", border:"1px solid #E2DAC8", borderRadius:9, overflow:"hidden" }}>
      {categories.map((c) => (
        <div
          key={c}
          onClick={() => onChange(c)}
          style={{ padding:"7px 13px", fontSize:12, cursor:"pointer", background: active===c ? "#1A4A35" : "transparent", color: active===c ? "#fff" : "#6B6455", fontWeight: active===c ? 600 : 400, transition:"all .15s" }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}
