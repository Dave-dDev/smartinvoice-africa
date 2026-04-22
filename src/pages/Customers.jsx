/**
 * SmartInvoice Africa — Customers Page
 */

import { useState, useEffect } from "react";
import { Avatar, Btn, Modal, Input, RealtimeStatus } from "../components/UI.jsx";
import { CUSTOMERS_DATA, AVATAR_COLORS, fmt, currencySymbol, makeInitials } from "../data/mockData.js";
import { fetchCustomers, createCustomer } from "../services/customerService.js";
import { useRealtimeCustomers } from "../hooks/useRealtimeCustomers.js";

export default function Customers({ currency }) {
  const sym = currencySymbol(currency);

  // Start with mock data immediately so page displays
  const [customers, setCustomers] = useState(CUSTOMERS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search,    setSearch]    = useState("");
  const [form, setForm] = useState({ name:"", contact_person:"", email:"", city:"", country:"" });

  // Load from Supabase in background
  useEffect(() => {
    let isMounted = true;
    console.log("📦 Loading customers from Supabase...");
    fetchCustomers()
      .then((data) => {
        console.log("✅ Fetched customers:", data);
        // Only update if we got data from database AND component is still mounted
        if (isMounted && data && data.length > 0) {
          console.log(`📊 Using ${data.length} customers from database`);
          setCustomers(data);
        } else if (isMounted) {
          console.log("📊 No customers in database, keeping mock data");
        }
      })
      .catch((e) => {
        console.error("❌ Failed to load customers:", e.message);
        if (isMounted) {
          setError(e.message);
          console.log("📊 Keeping mock data due to error");
        }
      })
      .finally(() => {
        if (isMounted) {
          console.log("✅ Background load complete");
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Enable realtime updates
  const realtime = useRealtimeCustomers(setCustomers);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Normalize customer data to handle both camelCase and snake_case fields
  const normalizeCustomer = (c) => ({
    ...c,
    contact_person: c.contact_person || c.contact || c.contactPerson || "—",
    total_invoiced: c.total_invoiced || c.totalInvoiced || c.total_invoiced || 0,
    created_at: c.created_at || c.createdAt || c.lastInvoice || null
  });

  const filtered = customers
    .map(normalizeCustomer)
    .filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
    );

  const handleAdd = async () => {
    if (!form.name.trim()) {
      alert("Please enter a customer name");
      return;
    }

    try {
      const newCustomer = await createCustomer({
        name: form.name,
        contactPerson: form.contact_person,
        email: form.email,
        phone: form.phone || null,
        city: form.city,
        country: form.country || "Nigeria"
      });
      setCustomers((prev) => [newCustomer, ...prev]);
      setShowModal(false);
      setForm({ name:"", contact_person:"", email:"", city:"", country:"" });
    } catch (e) {
      console.error("Failed to create customer:", e.message);
      setError(e.message);
    }
  };

  if (loading && customers.length === 0) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading customers…</div>;
  }

  return (
    <div className="page-content">
      {/* ── Toolbar ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, gap:12, flexWrap:"wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search customers…"
          style={{ padding:"8px 14px", border:"1.5px solid #E2DAC8", borderRadius:9, fontSize:13, background:"#FDFAF4", width:240, fontFamily:"DM Sans,sans-serif", outline:"none" }}
        />
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:12.5, color:"#6B6455" }}>{filtered.length} customers</span>
          <RealtimeStatus connectionStatus={realtime.connectionStatus} lastUpdate={realtime.lastUpdate} updateCount={realtime.updateCount} />
          <Btn variant="gold" onClick={() => setShowModal(true)}>＋ Add Customer</Btn>
        </div>
      </div>

      {/* ── Customer cards grid ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {filtered.map((c) => (
          <CustomerCard key={c.id} customer={c} sym={sym} onClick={() => setSelected(c)} />
        ))}
      </div>

      {/* Debug info */}
      {customers.length === 0 && !loading && (
        <div style={{ padding: 20, textAlign: "center", color: "#6B6455" }}>
          No customers loaded. Total: {customers.length}, Loading: {loading}
        </div>
      )}

      {filtered.length === 0 && search === "" && customers.length > 0 && (
        <div style={{ padding:60, textAlign:"center", color:"#6B6455", fontSize:14 }}>
          Customers array has {customers.length} items but none are displaying. Check console for details.
        </div>
      )}

      {filtered.length === 0 && search !== "" && (
        <div style={{ padding:60, textAlign:"center", color:"#6B6455", fontSize:14 }}>No customers found matching "{search}"</div>
      )}

      {/* ── Customer detail modal ── */}
      <CustomerDetailModal customer={selected} onClose={() => setSelected(null)} sym={sym} />

      {/* ── Add customer modal ── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Customer">
        <Input label="Business Name"   value={form.name}    onChange={(e) => set("name",    e.target.value)} placeholder="e.g. TechKing Solutions" required />
        <Input label="Contact Person"  value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} placeholder="Full name" />
        <Input label="Email"           value={form.email}   onChange={(e) => set("email",   e.target.value)} type="email" placeholder="email@example.com" />
        <Input label="Phone"           value={form.phone || ""}   onChange={(e) => set("phone",   e.target.value)} type="tel" placeholder="+234..." />
        <Input label="City"            value={form.city}    onChange={(e) => set("city",    e.target.value)} placeholder="Lagos, Nairobi, Accra…" />
        <Input label="Country"         value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Nigeria" />
        <Btn variant="forest" onClick={handleAdd} style={{ width:"100%", justifyContent:"center" }}>✅ Save Customer</Btn>
      </Modal>
    </div>
  );
}

// ── Customer Card ─────────────────────────────────────────────────────────────
function CustomerCard({ customer: c, sym, onClick }) {
  if (!c) {
    console.warn("CustomerCard received null/undefined customer");
    return null;
  }
  
  // Debug logging
  console.log("Rendering customer card:", c.name, "with ID:", c.id);
  
  // Ensure normalized fields with safe defaults
  const contactPerson = c?.contact_person || c?.contact || c?.contactPerson || "—";
  const totalInvoiced = c?.total_invoiced || c?.totalInvoiced || 0;
  const createdAt = c?.created_at || c?.createdAt || c?.lastInvoice;
  const name = c?.name || "Unknown";
  const city = c?.city || "—";
  const email = c?.email || "—";
  const id = c?.id || 0;

  return (
    <div
      onClick={onClick}
      style={{ background:"#FDFAF4", border:"1px solid #E2DAC8", borderRadius:13, padding:20, cursor:"pointer", transition:"transform .18s,box-shadow .18s" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
        <Avatar initials={makeInitials(name)} color={AVATAR_COLORS[id ? (typeof id === 'number' ? id % AVATAR_COLORS.length : id.charCodeAt(0) % AVATAR_COLORS.length) : 0]} size={40} />
        <div>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:600 }}>{name}</div>
          <div style={{ fontSize:12.5, color:"#6B6455" }}>{city}</div>
        </div>
      </div>

      {/* Info */}
      <div style={{ fontSize:12, color:"#6B6455" }}>{contactPerson}</div>


      {/* Stats */}
      <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderTop:"1px solid #F0EDE4", borderBottom:"1px solid #F0EDE4", marginBottom:10 }}>
        <div>
          <div style={{ fontSize:10.5, color:"#6B6455", textTransform:"uppercase", letterSpacing:".6px" }}>Total Invoiced</div>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:700, color:"#1A4A35", marginTop:2 }}>{fmt(totalInvoiced, sym)}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10.5, color:"#6B6455", textTransform:"uppercase", letterSpacing:".6px" }}>Created</div>
          <div style={{ fontSize:12.5, marginTop:2 }}>{createdAt ? new Date(createdAt).toLocaleDateString() : "—"}</div>
        </div>
      </div>

      <div style={{ fontSize:12, color:"#6B6455" }}>📧 {email}</div>
    </div>
  );
}

// ── Customer Detail Modal ─────────────────────────────────────────────────────
function CustomerDetailModal({ customer: c, onClose, sym }) {
  if (!c) return null;
  
  // Normalize fields for display
  const contactPerson = c.contact_person || c.contact || c.contactPerson || "—";
  const totalInvoiced = c.total_invoiced || c.totalInvoiced || 0;
  const phone = c.phone || c.phone_number || "—";
  
  return (
    <Modal open title={c.name} onClose={onClose}>
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
        <Avatar initials={makeInitials(c.name)} color={AVATAR_COLORS[c.id ? (typeof c.id === 'number' ? c.id % AVATAR_COLORS.length : c.id.charCodeAt(0) % AVATAR_COLORS.length) : 0]} size={52} />
        <div>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700 }}>{c.name}</div>
          <div style={{ fontSize:13, color:"#6B6455" }}>{c.city || "—"}</div>
        </div>
      </div>
      {[
        ["Contact Person", contactPerson], 
        ["Email", c.email || "—"], 
        ["Phone", phone], 
        ["Total Invoiced", fmt(totalInvoiced, sym)]
      ].map(([k, v]) => (
        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #F0EDE4" }}>
          <span style={{ fontSize:12.5, color:"#6B6455" }}>{k}</span>
          <span style={{ fontSize:13, fontWeight:500 }}>{v}</span>
        </div>
      ))}
      <div style={{ marginTop:18, display:"flex", gap:8 }}>
        <Btn variant="forest" style={{ flex:1, justifyContent:"center" }}>📄 New Invoice</Btn>
        <Btn variant="ghost"  style={{ flex:1, justifyContent:"center" }}>💬 WhatsApp</Btn>
      </div>
    </Modal>
  );
}
