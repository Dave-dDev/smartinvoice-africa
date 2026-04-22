/**
 * SmartInvoice Africa — Invoices Page
 */

import { useState, useEffect } from "react";
import { Avatar, Badge, Btn, Panel, Modal, Input, Select, RealtimeStatus } from "../components/UI.jsx";
import { fmt, currencySymbol, makeInitials, AVATAR_COLORS } from "../data/mockData.js";
import { fetchInvoices, createInvoice, updateInvoiceStatus, deleteInvoice } from "../services/invoiceService.js";
import { useRealtimeInvoices } from "../hooks/useRealtimeInvoices.js";
import { getDueDateStatus } from "../hooks/useDueDateStatus.js";
import { exportInvoicesCsv } from "../lib/csvExport.js";

export default function Invoices({ invoices: initialInvoices, setInvoices: setInitialInvoices, currency }) {
  const sym = currencySymbol(currency);

  const [invoices, setInvoices] = useState(initialInvoices || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [exportMsg, setExportMsg] = useState(null);

  // Load invoices on mount
  useEffect(() => {
    fetchInvoices()
      .then(setInvoices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Enable realtime updates and get connection status
  const realtime = useRealtimeInvoices(setInvoices);

  const filtered = invoices.filter((inv) => {
    const matchFilter = filter === "all" || inv.status === filter;
    const matchSearch = 
      (inv.customer_name && inv.customer_name.toLowerCase().includes(search.toLowerCase())) || 
      (inv.invoice_number && inv.invoice_number.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const handleCreate = async (formData) => {
    try {
      const newInvoice = await createInvoice(formData);
      setInvoices((prev) => [newInvoice, ...prev]);
      setShowCreate(false);
    } catch (e) {
      console.error("Failed to create invoice:", e.message);
      setError(e.message);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)));
    }
  };

  const handleBulkExport = () => {
    const rows = filtered.filter((i) => selectedIds.has(i.id));
    const filename = exportInvoicesCsv(rows.length ? rows : filtered, filter, sym);
    setExportMsg(`✅ ${filename}`);
    setTimeout(() => setExportMsg(null), 3000);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading invoices…</div>;
  }

  if (error && !invoices.length) {
    return <div style={{ padding: 40, color: "#C4522A" }}>Error: {error}</div>;
  }

  return (
    <div className="page-content">
      {/* ── Toolbar ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search invoices…"
            style={{ padding:"8px 14px", border:"1.5px solid #E2DAC8", borderRadius:9, fontSize:13, background:"#FDFAF4", width:220, fontFamily:"DM Sans,sans-serif", outline:"none" }}
          />
          <StatusFilter active={filter} onChange={(f) => { setFilter(f); setSelectedIds(new Set()); }} />
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {exportMsg && <span style={{ fontSize:11, color:"#1A6A40", fontWeight:600 }}>{exportMsg}</span>}
          <RealtimeStatus connectionStatus={realtime.connectionStatus} lastUpdate={realtime.lastUpdate} updateCount={realtime.updateCount} />
          <Btn variant="ghost" onClick={handleBulkExport} title="Export to CSV">⬇ CSV</Btn>
          <Btn variant="gold" onClick={() => setShowCreate(true)}>＋ New Invoice</Btn>
        </div>
      </div>

      {/* ── Bulk action bar ── */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onExport={handleBulkExport}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* ── Summary cards ── */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:"Total Invoiced",    val: fmt(invoices.reduce((a,b)=>a+b.total,0), sym), color:"#1A4A35" },
          { label:"Awaiting Payment",  val: fmt(invoices.filter(i=>i.status!=="paid").reduce((a,b)=>a+b.total,0), sym), color:"#E8A020" },
          { label:"Collected",         val: fmt(invoices.filter(i=>i.status==="paid").reduce((a,b)=>a+b.total,0), sym), color:"#1A7A50" },
          { label:"Overdue",           val: fmt(invoices.filter(i=>i.status==="overdue").reduce((a,b)=>a+b.total,0), sym), color:"#C4522A" },
        ].map((s, i) => (
          <div key={i} style={{ background:"#FDFAF4", border:"1px solid #E2DAC8", borderRadius:11, padding:"14px 16px" }}>
            <div style={{ fontSize:10.5, color:"#6B6455", textTransform:"uppercase", letterSpacing:".6px", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:"Syne,sans-serif", fontSize:17, fontWeight:700, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <Panel>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  style={{ cursor: "pointer", accentColor: "#1A4A35" }}
                />
              </th>
              {["Invoice","Client","Amount","Due Date","Status","Actions"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => {
              const ds = getDueDateStatus(inv.due_date || inv.due, inv.status);
              const isChecked = selectedIds.has(inv.id);
              return (
                <tr
                  key={inv.id}
                  onClick={() => setSelected(inv)}
                  style={{ background: isChecked ? "#F0F7F4" : undefined }}
                >
                  <td onClick={(e) => { e.stopPropagation(); toggleSelect(inv.id); }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(inv.id)}
                      style={{ cursor: "pointer", accentColor: "#1A4A35" }}
                    />
                  </td>
                  <td style={{ fontSize:13, fontWeight:600, color:"#1A4A35" }}>{inv.invoice_number}</td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                      <Avatar initials={makeInitials(inv.customer_name)} color={AVATAR_COLORS[filtered.indexOf(inv) % AVATAR_COLORS.length]} size={30} />
                      <span style={{ fontSize:13, fontWeight:500 }}>{inv.customer_name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:700 }}>{fmt(inv.total, sym)}</td>
                  <td>
                    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                      <span style={{ fontSize:12, color:"#6B6455" }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</span>
                      {inv.status !== "paid" && inv.due_date && (
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6, background:ds.bg, color:ds.color, width:"fit-content" }}>
                          {ds.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td><Badge status={inv.status} /></td>
                  <td>
                    <div style={{ display:"flex", gap:6 }}>
                      <Btn variant="ghost" small onClick={(e) => e.stopPropagation()}>📤</Btn>
                      <Btn variant="ghost" small onClick={(e) => e.stopPropagation()}>💬</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding:40, textAlign:"center", color:"#6B6455", fontSize:14 }}>
            No invoices found
          </div>
        )}
      </Panel>

      {/* ── View Invoice modal ── */}
      <ViewInvoiceModal
        invoice={selected}
        onClose={() => setSelected(null)}
        sym={sym}
      />

      {/* ── Create Invoice modal ── */}
      <CreateInvoiceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        sym={sym}
        existingCount={invoices.length}
      />
    </div>
  );
}

// ── Status Filter Tabs ────────────────────────────────────────────────────────
function StatusFilter({ active, onChange }) {
  const tabs = ["all","sent","viewed","paid","overdue"];
  return (
    <div style={{ display:"flex", background:"#FDFAF4", border:"1px solid #E2DAC8", borderRadius:9, overflow:"hidden" }}>
      {tabs.map((s) => (
        <div
          key={s}
          onClick={() => onChange(s)}
          style={{ padding:"7px 12px", fontSize:12, cursor:"pointer", fontWeight: active===s ? 600 : 400, background: active===s ? "#1A4A35" : "transparent", color: active===s ? "#fff" : "#6B6455", transition:"all .15s", textTransform:"capitalize" }}
        >
          {s}
        </div>
      ))}
    </div>
  );
}

// ── View Invoice Modal ────────────────────────────────────────────────────────
function ViewInvoiceModal({ invoice, onClose, sym }) {
  if (!invoice) return null;
  return (
    <Modal open title={`${invoice.invoice_number} — ${invoice.customer_name}`} onClose={onClose}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
        <Badge status={invoice.status} />
        <span style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:800 }}>{fmt(invoice.total, sym)}</span>
      </div>
      {[["Client", invoice.customer_name], ["Email", invoice.customer_email||"—"], ["Due Date", invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"]].map(([k, v]) => (
        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #F0EDE4" }}>
          <span style={{ fontSize:12.5, color:"#6B6455" }}>{k}</span>
          <span style={{ fontSize:13, fontWeight:500 }}>{v}</span>
        </div>
      ))}
      <div style={{ marginTop:20, padding:16, background:"#F5F0E8", borderRadius:10 }}>
        <div style={{ fontSize:12, color:"#6B6455", marginBottom:8, fontWeight:600 }}>Payment Options</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Btn variant="forest" small>🏦 Bank Transfer</Btn>
          <Btn variant="gold" small>💳 Pay via Paystack</Btn>
          <Btn variant="ghost" small>📱 Mobile Money</Btn>
        </div>
      </div>
      <div style={{ marginTop:14, display:"flex", gap:8 }}>
        <Btn variant="forest" style={{ flex:1, justifyContent:"center" }}>📤 Send Invoice</Btn>
        <Btn variant="ghost"  style={{ flex:1, justifyContent:"center" }}>💬 WhatsApp</Btn>
      </div>
    </Modal>
  );
}

// ── Create Invoice Modal ──────────────────────────────────────────────────────
function CreateInvoiceModal({ open, onClose, onCreate, sym, existingCount }) {
  const [form, setForm] = useState({
    customerName: "", customerEmail: "", dueDate: "",
    items: [{ description:"", quantity:1, unit_price:"" }],
    vatRate: 7.5,
    notes: "",
    currency: "NGN"
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const updateItem = (i, field, val) =>
    setForm((f) => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items }; });

  const addItem    = () => setForm((f) => ({ ...f, items: [...f.items, { description:"", quantity:1, unit_price:"" }] }));
  const removeItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const subtotal = form.items.reduce((a, b) => a + (parseFloat(b.unit_price)||0) * (parseFloat(b.quantity)||1), 0);
  const vatAmt   = subtotal * (form.vatRate / 100);
  const total    = subtotal + vatAmt;

  const handleSubmit = async () => {
    if (!form.customerName.trim()) {
      alert("Please enter a customer name");
      return;
    }
    if (form.items.length === 0 || !form.items.some(i => i.description && i.unit_price)) {
      alert("Please add at least one line item");
      return;
    }

    await onCreate({
      customerName: form.customerName,
      customerEmail: form.customerEmail || null,
      customerId: null,
      dueDate: form.dueDate || null,
      items: form.items.map(i => ({
        description: i.description,
        quantity: parseFloat(i.quantity) || 1,
        unit_price: parseFloat(i.unit_price) || 0
      })),
      vatRate: form.vatRate,
      notes: form.notes,
      currency: form.currency
    });
    
    // Reset form
    setForm({
      customerName: "", customerEmail: "", dueDate: "",
      items: [{ description:"", quantity:1, unit_price:"" }],
      vatRate: 7.5,
      notes: "",
      currency: "NGN"
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Invoice">
      <Input label="Customer Name"  value={form.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="e.g. TechKing Solutions" required />
      <Input label="Customer Email" value={form.customerEmail}  onChange={(e) => set("customerEmail",  e.target.value)} placeholder="client@example.com" type="email" />
      <Input label="Due Date"     value={form.dueDate}    onChange={(e) => set("dueDate",    e.target.value)} type="date" />

      {/* Line items */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <label className="field-label">Line Items *</label>
          <span onClick={addItem} style={{ fontSize:12, color:"#1A4A35", fontWeight:600, cursor:"pointer" }}>＋ Add item</span>
        </div>
        {form.items.map((item, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 60px 90px auto", gap:7, marginBottom:7 }}>
            <input value={item.description}  onChange={(e) => updateItem(i,"description",e.target.value)}  placeholder="Description" style={{ padding:"8px 10px", border:"1.5px solid #E2DAC8", borderRadius:7, fontSize:12.5, background:"#F9F6EF", fontFamily:"DM Sans,sans-serif" }} />
            <input value={item.quantity}   onChange={(e) => updateItem(i,"quantity", e.target.value)}  type="number" placeholder="Qty"  style={{ padding:"8px 8px",  border:"1.5px solid #E2DAC8", borderRadius:7, fontSize:12.5, background:"#F9F6EF", fontFamily:"DM Sans,sans-serif" }} />
            <input value={item.unit_price} onChange={(e) => updateItem(i,"unit_price",e.target.value)} type="number" placeholder="Price" style={{ padding:"8px 8px", border:"1.5px solid #E2DAC8", borderRadius:7, fontSize:12.5, background:"#F9F6EF", fontFamily:"DM Sans,sans-serif" }} />
            {form.items.length > 1 && (
              <span onClick={() => removeItem(i)} style={{ cursor:"pointer", fontSize:18, color:"#C4522A", display:"flex", alignItems:"center" }}>×</span>
            )}
          </div>
        ))}
      </div>

      {/* VAT rate input */}
      <div style={{ marginBottom:16 }}>
        <label className="field-label">VAT Rate (%)</label>
        <input 
          type="number" 
          value={form.vatRate} 
          onChange={(e) => set("vatRate", parseFloat(e.target.value) || 0)}
          min="0"
          max="100"
          step="0.1"
          style={{ padding:"8px 10px", border:"1.5px solid #E2DAC8", borderRadius:7, fontSize:12.5, background:"#F9F6EF", fontFamily:"DM Sans,sans-serif", width:"100%" }}
        />
      </div>

      {/* Notes */}
      <div style={{ marginBottom:16 }}>
        <label className="field-label">Notes (optional)</label>
        <textarea 
          value={form.notes} 
          onChange={(e) => set("notes", e.target.value)}
          placeholder="e.g. Payment terms, additional notes"
          style={{ padding:"8px 10px", border:"1.5px solid #E2DAC8", borderRadius:7, fontSize:12.5, background:"#F9F6EF", fontFamily:"DM Sans,sans-serif", width:"100%", minHeight:"60px" }}
        />
      </div>

      {/* Totals */}
      <div style={{ background:"#F5F0E8", borderRadius:10, padding:14, marginBottom:18 }}>
        <Row label="Subtotal" val={fmt(subtotal, sym)} />
        {form.vatRate > 0 && <Row label={`VAT (${form.vatRate}%)`} val={fmt(vatAmt, sym)} />}
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontFamily:"Syne,sans-serif", fontWeight:700, marginTop:8, paddingTop:8, borderTop:"1px solid #E2DAC8" }}>
          <span>Total</span>
          <span style={{ color:"#1A4A35" }}>{fmt(total, sym)}</span>
        </div>
      </div>

      <Btn variant="forest" onClick={handleSubmit} style={{ width:"100%", justifyContent:"center" }}>
        ✅ Create &amp; Send Invoice
      </Btn>
    </Modal>
  );
}

function Row({ label, val }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
      <span style={{ color:"#6B6455" }}>{label}</span>
      <strong>{val}</strong>
    </div>
  );
}

// ── Bulk Action Bar ────────────────────────────────────────────────────────────
function BulkActionBar({ count, onExport, onClear }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#1A4A35",
        borderRadius: 10,
        padding: "10px 18px",
        marginBottom: 14,
        animation: "slideDown .18s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#F5C44A" }}>
          {count} invoice{count !== 1 ? "s" : ""} selected
        </span>
        <button
          onClick={onExport}
          style={{
            fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 7,
            background: "#E8A020", color: "#0D0D0D", border: "none", cursor: "pointer",
          }}
        >
          ⬇ Export CSV
        </button>
      </div>
      <button
        onClick={onClear}
        style={{
          background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)",
          borderRadius: 7, padding: "5px 12px", fontSize: 12, color: "rgba(255,255,255,.8)",
          cursor: "pointer",
        }}
      >
        ✕ Clear selection
      </button>
      <style>{`@keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }`}</style>
    </div>
  );
}
