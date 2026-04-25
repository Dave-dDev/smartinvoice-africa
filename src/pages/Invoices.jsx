/**
 * SmartInvoice Africa — Invoices Page
 */

import { useState, useEffect } from "react";
import { Avatar, Badge, Btn, Panel, Modal, Input, Select, RealtimeStatus } from "../components/UI.jsx";
import { fmt, currencySymbol, makeInitials, AVATAR_COLORS } from "../data/mockData.js";
import { fetchInvoices, createInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice } from "../services/invoiceService.js";
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
  const [editInvoice, setEditInvoice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleEdit = async (formData) => {
    try {
      const updated = await updateInvoice(editInvoice.id, formData);
      setInvoices((prev) => prev.map((inv) => inv.id === updated.id ? { ...inv, ...updated } : inv));
      setEditInvoice(null);
      setSelected(null);
    } catch (e) {
      console.error("Failed to update invoice:", e.message);
      setError(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteInvoice(deleteTarget.id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSelected(null);
    } catch (e) {
      console.error("Failed to delete invoice:", e.message);
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleWhatsApp = (inv) => {
    const phone = (inv.customer_phone || "").replace(/\D/g, "");
    const due = inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "soon";
    const msg = `Hello ${inv.customer_name}, this is a friendly reminder that invoice ${inv.invoice_number} for ${sym}${(inv.total || 0).toLocaleString()} is due on ${due}. Please arrange payment at your earliest convenience. Thank you!`;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handlePrint = (inv) => {
    const printWin = window.open("", "_blank", "width=800,height=600");
    printWin.document.write(`
      <!DOCTYPE html><html><head><title>${inv.invoice_number}</title>
      <style>
        body{font-family:'DM Sans',sans-serif;padding:40px;color:#0D0D0D;background:#fff}
        h1{font-size:28px;font-weight:800;color:#1A4A35;margin-bottom:4px}
        .sub{color:#6B6455;font-size:13px;margin-bottom:30px}
        .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:13px}
        .total{font-size:18px;font-weight:700;color:#1A4A35}
        table{width:100%;border-collapse:collapse;margin:20px 0}
        th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6B6455;padding:8px 0;border-bottom:2px solid #E2DAC8}
        td{padding:10px 0;font-size:13px;border-bottom:1px solid #F0EDE4}
        .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#D4EDE3;color:#1A6A40;text-transform:uppercase}
        @media print{button{display:none}}
      </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px">
        <div><h1>SmartInvoice</h1><div class="sub">Africa · Tax Invoice</div></div>
        <div style="text-align:right">
          <div style="font-size:22px;font-weight:800">${inv.invoice_number}</div>
          <span class="badge">${inv.status}</span>
        </div>
      </div>
      <div class="row"><span>Bill To</span><span style="font-weight:600">${inv.customer_name}</span></div>
      ${inv.customer_email ? `<div class="row"><span>Email</span><span>${inv.customer_email}</span></div>` : ""}
      <div class="row"><span>Due Date</span><span>${inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</span></div>
      <table>
        <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
        <tbody>
          ${(inv.invoice_items || []).map(it => `<tr><td>${it.description}</td><td>${it.quantity}</td><td>${sym}${(it.unit_price||0).toLocaleString()}</td><td>${sym}${((it.quantity||1)*(it.unit_price||0)).toLocaleString()}</td></tr>`).join("") || `<tr><td colspan="4" style="color:#6B6455">No line items recorded</td></tr>`}
        </tbody>
      </table>
      <div style="max-width:300px;margin-left:auto">
        <div class="row"><span>Subtotal</span><span>${sym}${(inv.subtotal||inv.total||0).toLocaleString()}</span></div>
        ${inv.vat_rate ? `<div class="row"><span>VAT (${inv.vat_rate}%)</span><span>${sym}${(inv.vat_amount||0).toLocaleString()}</span></div>` : ""}
        <div class="row total"><span>Total</span><span>${sym}${(inv.total||0).toLocaleString()}</span></div>
      </div>
      ${inv.notes ? `<div style="margin-top:24px;padding:14px;background:#F5F0E8;border-radius:8px"><div style="font-size:11px;color:#6B6455;margin-bottom:4px">NOTES</div><div style="font-size:13px">${inv.notes}</div></div>` : ""}
      <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body></html>`);
    printWin.document.close();
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
        onEdit={(inv) => { setEditInvoice(inv); setSelected(null); }}
        onDelete={(inv) => setDeleteTarget(inv)}
        onWhatsApp={handleWhatsApp}
        onPrint={handlePrint}
        onStatusChange={async (inv, status) => {
          await updateInvoiceStatus(inv.id, status);
          setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, status } : i));
          setSelected(null);
        }}
      />

      {/* ── Edit Invoice modal ── */}
      <EditInvoiceModal
        invoice={editInvoice}
        onClose={() => setEditInvoice(null)}
        onSave={handleEdit}
        sym={sym}
      />

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          invoice={deleteTarget}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          sym={sym}
        />
      )}

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
function ViewInvoiceModal({ invoice, onClose, sym, onEdit, onDelete, onWhatsApp, onPrint, onStatusChange }) {
  if (!invoice) return null;
  const isPaid = invoice.status === "paid";
  return (
    <Modal open title={`${invoice.invoice_number} — ${invoice.customer_name}`} onClose={onClose}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <Badge status={invoice.status} />
        <span style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:800 }}>{fmt(invoice.total, sym)}</span>
      </div>

      {[["Client", invoice.customer_name], ["Email", invoice.customer_email||"—"], ["Phone", invoice.customer_phone||"—"], ["Due Date", invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"], ["Notes", invoice.notes||"—"]].map(([k, v]) => (
        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #F0EDE4" }}>
          <span style={{ fontSize:12.5, color:"#6B6455" }}>{k}</span>
          <span style={{ fontSize:13, fontWeight:500, maxWidth:260, textAlign:"right" }}>{v}</span>
        </div>
      ))}

      {/* Line items */}
      {invoice.invoice_items && invoice.invoice_items.length > 0 && (
        <div style={{ marginTop:16, background:"#F5F0E8", borderRadius:10, padding:"12px 14px" }}>
          <div style={{ fontSize:11, color:"#6B6455", fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:".6px" }}>Line Items</div>
          {invoice.invoice_items.map((item, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, padding:"5px 0", borderBottom:"1px solid #E8E0D0" }}>
              <span>{item.description} × {item.quantity}</span>
              <span style={{ fontWeight:600 }}>{fmt((item.unit_price||0)*(item.quantity||1), sym)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Status actions */}
      {!isPaid && (
        <div style={{ marginTop:16, display:"flex", gap:8, flexWrap:"wrap" }}>
          <Btn variant="forest" small onClick={() => onStatusChange(invoice, "paid")}>✅ Mark as Paid</Btn>
          <Btn variant="ghost"  small onClick={() => onStatusChange(invoice, "sent")}>📤 Mark Sent</Btn>
          <Btn variant="ghost"  small onClick={() => onStatusChange(invoice, "viewed")}>👁 Mark Viewed</Btn>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop:14, display:"flex", gap:8, flexWrap:"wrap" }}>
        <Btn variant="forest" style={{ flex:1, justifyContent:"center" }} onClick={() => onPrint(invoice)}>🖨 Print / PDF</Btn>
        <Btn variant="ghost"  style={{ flex:1, justifyContent:"center" }} onClick={() => onWhatsApp(invoice)}>💬 WhatsApp</Btn>
      </div>
      <div style={{ marginTop:8, display:"flex", gap:8 }}>
        <Btn variant="outline" small onClick={() => onEdit(invoice)}>✏️ Edit</Btn>
        <Btn variant="danger"  small onClick={() => onDelete(invoice)}>🗑 Delete</Btn>
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

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ invoice, loading, onConfirm, onCancel, sym }) {
  return (
    <div onClick={onCancel} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:"#FDFAF4", borderRadius:16, padding:28, maxWidth:400, width:"100%", boxShadow:"0 24px 60px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize:32, textAlign:"center", marginBottom:12 }}>🗑</div>
        <div style={{ fontFamily:"Syne,sans-serif", fontSize:17, fontWeight:700, textAlign:"center", marginBottom:6 }}>Delete Invoice?</div>
        <div style={{ fontSize:13, color:"#6B6455", textAlign:"center", marginBottom:20 }}>
          <strong>{invoice.invoice_number}</strong> · {invoice.customer_name} · {fmt(invoice.total, sym)}<br />
          <span style={{ color:"#C4522A" }}>This action cannot be undone.</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="ghost"  onClick={onCancel}  style={{ flex:1, justifyContent:"center" }}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={loading} style={{ flex:1, justifyContent:"center" }}>
            {loading ? "Deleting…" : "Delete"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Edit Invoice Modal ────────────────────────────────────────────────────────
function EditInvoiceModal({ invoice, onClose, onSave, sym }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Populate form when invoice changes
  useState(() => {
    if (invoice) {
      setForm({
        customerName: invoice.customer_name || "",
        customerEmail: invoice.customer_email || "",
        dueDate: invoice.due_date ? invoice.due_date.split("T")[0] : "",
        vatRate: invoice.vat_rate || 7.5,
        notes: invoice.notes || "",
        currency: invoice.currency || "NGN",
        items: invoice.invoice_items?.length
          ? invoice.invoice_items.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price }))
          : [{ description:"", quantity:1, unit_price:"" }]
      });
    }
  }, [invoice]);

  if (!invoice || !form) return null;

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const updateItem = (i, field, val) => setForm((f) => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items }; });
  const addItem    = () => setForm((f) => ({ ...f, items: [...f.items, { description:"", quantity:1, unit_price:"" }] }));
  const removeItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const subtotal = form.items.reduce((a, b) => a + (parseFloat(b.unit_price)||0) * (parseFloat(b.quantity)||1), 0);
  const vatAmt   = subtotal * (form.vatRate / 100);
  const total    = subtotal + vatAmt;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave({
        customerName: form.customerName, customerEmail: form.customerEmail,
        dueDate: form.dueDate || null,
        items: form.items.map((i) => ({ description: i.description, quantity: parseFloat(i.quantity)||1, unit_price: parseFloat(i.unit_price)||0 })),
        vatRate: form.vatRate, notes: form.notes, currency: form.currency
      });
    } finally { setSaving(false); }
  };

  const inputStyle = { padding:"8px 10px", border:"1.5px solid #E2DAC8", borderRadius:7, fontSize:12.5, background:"#F9F6EF", fontFamily:"DM Sans,sans-serif", width:"100%" };

  return (
    <Modal open onClose={onClose} title={`Edit ${invoice.invoice_number}`}>
      <div style={{ marginBottom:14 }}><label className="field-label">Customer Name</label><input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom:14 }}><label className="field-label">Customer Email</label><input type="email" value={form.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom:14 }}><label className="field-label">Due Date</label><input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} style={inputStyle} /></div>

      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <label className="field-label">Line Items</label>
          <span onClick={addItem} style={{ fontSize:12, color:"#1A4A35", fontWeight:600, cursor:"pointer" }}>＋ Add item</span>
        </div>
        {form.items.map((item, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 60px 90px auto", gap:7, marginBottom:7 }}>
            <input value={item.description} onChange={(e) => updateItem(i,"description",e.target.value)} placeholder="Description" style={inputStyle} />
            <input value={item.quantity}    onChange={(e) => updateItem(i,"quantity",e.target.value)}    type="number" placeholder="Qty"  style={inputStyle} />
            <input value={item.unit_price}  onChange={(e) => updateItem(i,"unit_price",e.target.value)}  type="number" placeholder="Price" style={inputStyle} />
            {form.items.length > 1 && <span onClick={() => removeItem(i)} style={{ cursor:"pointer", fontSize:18, color:"#C4522A", display:"flex", alignItems:"center" }}>×</span>}
          </div>
        ))}
      </div>

      <div style={{ background:"#F5F0E8", borderRadius:10, padding:14, marginBottom:14 }}>
        <Row label="Subtotal" val={fmt(subtotal, sym)} />
        {form.vatRate > 0 && <Row label={`VAT (${form.vatRate}%)`} val={fmt(vatAmt, sym)} />}
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontFamily:"Syne,sans-serif", fontWeight:700, marginTop:8, paddingTop:8, borderTop:"1px solid #E2DAC8" }}><span>Total</span><span style={{ color:"#1A4A35" }}>{fmt(total, sym)}</span></div>
      </div>

      <Btn variant="forest" onClick={handleSubmit} disabled={saving} style={{ width:"100%", justifyContent:"center" }}>
        {saving ? "Saving…" : "✅ Save Changes"}
      </Btn>
    </Modal>
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
