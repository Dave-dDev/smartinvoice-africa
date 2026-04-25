/**
 * SmartInvoice Africa — Top Navigation Bar
 * Enhanced with live notification panel.
 */

import NotificationPanel from "./NotificationPanel.jsx";

const PAGE_TITLES = {
  dashboard:          "Dashboard",
  invoices:           "Invoices",
  expenses:           "Expenses",
  customers:          "Customers",
  reports:            "Reports",
  vat:                "VAT & Taxes",
  "financial-analysis": "Financial Analysis",
  settings:           "Settings",
};

export default function Topbar({ page, setSideOpen, currency, setCurrency, invoices = [], setPage }) {
  return (
    <header
      style={{
        background: "#1A4A35",
        borderBottom: "1px solid rgba(255,255,255,.08)",
        padding: "0 28px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: hamburger + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => setSideOpen((v) => !v)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            lineHeight: 1,
            color: "#fff",
          }}
          className="hamburger"
          aria-label="Open menu"
        >
          ☰
        </button>
        <span
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: 17,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {PAGE_TITLES[page] || "SmartInvoice"}
        </span>
      </div>

      {/* Right: currency toggle + notifications + user */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Currency toggle */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.15)",
            borderRadius: 8,
            overflow: "hidden",
            fontSize: 12,
          }}
        >
          {["NGN", "KES", "USD"].map((c) => (
            <div
              key={c}
              onClick={() => setCurrency(c)}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                fontWeight: 500,
                background: currency === c ? "rgba(232,160,32,.9)" : "transparent",
                color: currency === c ? "#0D0D0D" : "rgba(255,255,255,.7)",
                transition: "all .15s",
              }}
            >
              {c}
            </div>
          ))}
        </div>

        {/* Live Notification Bell */}
        <NotificationPanel invoices={invoices} />

        {/* Settings gear */}
        <button
          onClick={() => setPage && setPage("settings")}
          title="Settings"
          style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"rgba(255,255,255,.7)", padding:"4px 6px", borderRadius:7, transition:"color .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F5C44A")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.7)")}
        >
          ⚙
        </button>

        {/* User chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
            padding: "5px 10px 5px 5px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.15)",
            background: "rgba(255,255,255,.08)",
            transition: "background .2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.08)")}
        >
          <div
            style={{
              width: 26,
              height: 26,
              background: "linear-gradient(135deg,#E8A020,#C4522A)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            AO
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "#fff" }}>Adeola O.</span>
        </div>
      </div>
    </header>
  );
}
