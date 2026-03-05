/**
 * SmartInvoice Africa — Top Navigation Bar
 */

const PAGE_TITLES = {
  dashboard: "Dashboard",
  invoices:  "Invoices",
  expenses:  "Expenses",
  customers: "Customers",
  reports:   "Reports",
  vat:       "VAT & Taxes",
};

export default function Topbar({ page, setSideOpen, currency, setCurrency }) {
  return (
    <header
      style={{
        background: "#FDFAF4",
        borderBottom: "1px solid #E2DAC8",
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
          }}
          className="hamburger"
          aria-label="Open menu"
        >
          ☰
        </button>
        <span
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {PAGE_TITLES[page] || "SmartInvoice"}
        </span>
      </div>

      {/* Right: currency toggle + notifications + user */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Currency toggle */}
        <div
          style={{
            display: "flex",
            background: "#F5F0E8",
            border: "1px solid #E2DAC8",
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
                background: currency === c ? "#1A4A35" : "transparent",
                color: currency === c ? "#fff" : "#6B6455",
                transition: "all .15s",
              }}
            >
              {c}
            </div>
          ))}
        </div>

        {/* Notification bell */}
        <div
          style={{
            width: 34,
            height: 34,
            border: "1px solid #E2DAC8",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            background: "#F5F0E8",
            fontSize: 14,
            position: "relative",
            transition: "background .2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E2DAC8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#F5F0E8")}
        >
          🔔
          <div
            style={{
              position: "absolute",
              top: 7,
              right: 7,
              width: 7,
              height: 7,
              background: "#C4522A",
              borderRadius: "50%",
              border: "1.5px solid #FDFAF4",
            }}
          />
        </div>

        {/* User chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
            padding: "5px 10px 5px 5px",
            borderRadius: 10,
            border: "1px solid #E2DAC8",
            background: "#F5F0E8",
            transition: "background .2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E2DAC8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#F5F0E8")}
        >
          <div
            style={{
              width: 26,
              height: 26,
              background: "linear-gradient(135deg,#1A4A35,#2A6B4F)",
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
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>Adeola O.</span>
        </div>
      </div>
    </header>
  );
}
