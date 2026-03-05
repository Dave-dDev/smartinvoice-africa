/**
 * SmartInvoice Africa — Sidebar Navigation
 */

const NAV_ITEMS = [
  { id: "dashboard", icon: "⬡", label: "Dashboard",  section: "Main"       },
  { id: "invoices",  icon: "📄", label: "Invoices",   section: "Main", badge: 3 },
  { id: "expenses",  icon: "💸", label: "Expenses",   section: "Main"       },
  { id: "customers", icon: "👥", label: "Customers",  section: "Manage"     },
  { id: "reports",   icon: "📊", label: "Reports",    section: "Manage"     },
  { id: "vat",       icon: "🧾", label: "VAT & Taxes",section: "Compliance" },
];

export default function Sidebar({ page, setPage, setSideOpen }) {
  const sections = [...new Set(NAV_ITEMS.map((n) => n.section))];

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 230,
        background: "#1A4A35",
        display: "flex",
        flexDirection: "column",
        zIndex: 90,
        overflowY: "auto",
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          padding: "24px 20px 18px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#E8A020",
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              fontWeight: 800,
              color: "#0D0D0D",
              fontFamily: "Syne, sans-serif",
            }}
          >
            ₦
          </div>
          <div>
            <div
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: "#fff",
              }}
            >
              SmartInvoice
            </div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 2,
                color: "rgba(255,255,255,.4)",
                textTransform: "uppercase",
              }}
            >
              Africa
            </div>
          </div>
        </div>

        {/* Business pill */}
        <div
          style={{
            marginTop: 14,
            background: "rgba(255,255,255,.07)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 10,
            padding: "9px 12px",
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "linear-gradient(135deg,#E8A020,#C4522A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "Syne, sans-serif",
              flexShrink: 0,
            }}
          >
            AT
          </div>
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Adebayo Traders Ltd
            </div>
            <div style={{ fontSize: 10, color: "#F5C44A", marginTop: 1 }}>
              ⚡ Growth Plan
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ padding: "14px 12px", flex: 1 }}>
        {sections.map((section) => (
          <div key={section}>
            {/* Section label */}
            <div
              style={{
                fontSize: 9,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "rgba(255,255,255,.3)",
                padding: "0 10px",
                marginBottom: 6,
                marginTop: 18,
              }}
            >
              {section}
            </div>

            {/* Nav items */}
            {NAV_ITEMS.filter((n) => n.section === section).map((n) => {
              const active = page === n.id;
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    setPage(n.id);
                    setSideOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "9px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    marginBottom: 1,
                    position: "relative",
                    background: active ? "rgba(232,160,32,.18)" : "transparent",
                    color: active ? "#F5C44A" : "rgba(255,255,255,.6)",
                    fontWeight: active ? 500 : 400,
                    fontSize: 13.5,
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(255,255,255,.06)";
                      e.currentTarget.style.color = "rgba(255,255,255,.9)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,.6)";
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "20%",
                        bottom: "20%",
                        width: 3,
                        background: "#E8A020",
                        borderRadius: "0 4px 4px 0",
                      }}
                    />
                  )}

                  <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>
                    {n.icon}
                  </span>
                  {n.label}

                  {n.badge && (
                    <span
                      style={{
                        marginLeft: "auto",
                        background: "#C4522A",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 20,
                      }}
                    >
                      {n.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid rgba(255,255,255,.08)",
          fontSize: 11,
          color: "rgba(255,255,255,.3)",
        }}
      >
        🟢 Synced · Just now
      </div>
    </aside>
  );
}
