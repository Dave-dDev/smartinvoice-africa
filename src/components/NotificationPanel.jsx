/**
 * SmartInvoice Africa — Notification Panel
 * Slide-in panel with prioritised alerts derived from invoice state.
 */

import { useState, useEffect, useRef } from "react";
import { fmt } from "../data/mockData.js";

const TYPE_META = {
  overdue:  { color: "#993A1A", bg: "#FAE0D5", border: "#F5C4B0", dot: "#C4522A" },
  "due-soon": { color: "#996A10", bg: "#FFF4D6", border: "#F5E0A0", dot: "#E8A020" },
  paid:     { color: "#1A6A40", bg: "#D4EDE3", border: "#A8D8BC", dot: "#1A7A50" },
};

export default function NotificationPanel({ notifications = [], unreadCount = 0, sym = "₦" }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* ── Bell Button ── */}
      <button
        id="notification-bell"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "relative",
          background: open ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.08)",
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 9,
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 16,
          transition: "background .15s",
          color: "#fff",
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#C4522A",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              border: "1.5px solid #1A4A35",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Slide-in Panel ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 340,
            background: "#FDFAF4",
            border: "1px solid #E2DAC8",
            borderRadius: 14,
            boxShadow: "0 16px 48px rgba(0,0,0,.15)",
            zIndex: 200,
            overflow: "hidden",
            animation: "slideDown .18s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #E2DAC8",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#1A4A35",
            }}
          >
            <span style={{ fontFamily: "Syne,sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>
              🔔 Alerts &amp; Notifications
            </span>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: "#C4522A",
                  color: "#fff",
                  padding: "2px 7px",
                  borderRadius: 20,
                }}
              >
                {unreadCount} action{unreadCount !== 1 ? "s" : ""} needed
              </span>
            )}
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🎉</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A4A35" }}>All caught up!</div>
                <div style={{ fontSize: 12, color: "#6B6455", marginTop: 4 }}>No pending alerts</div>
              </div>
            ) : (
              notifications.map((n, idx) => {
                const meta = TYPE_META[n.type] || TYPE_META["due-soon"];
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: idx < notifications.length - 1 ? "1px solid #F0EDE4" : "none",
                      display: "flex",
                      gap: 11,
                      alignItems: "flex-start",
                      cursor: "default",
                      transition: "background .12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F0E8")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    {/* Type dot */}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: meta.dot,
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1A4A35", marginBottom: 2 }}>
                        {n.icon} {n.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#6B6455", marginBottom: 6 }}>{n.subtitle}</div>

                      {/* Amount + action */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "Syne,sans-serif",
                            color: meta.color,
                          }}
                        >
                          {fmt(n.amount, sym)}
                        </span>

                        {n.type === "overdue" && (
                          <div style={{ display: "flex", gap: 5 }}>
                            <ActionChip label="💬 WhatsApp" />
                            <ActionChip label="📧 Email" />
                          </div>
                        )}
                        {n.type === "due-soon" && <ActionChip label="📤 Send Reminder" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid #E2DAC8",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#F9F6EF",
              }}
            >
              <span style={{ fontSize: 11, color: "#6B6455" }}>
                {notifications.filter((n) => n.type === "overdue").length} overdue ·{" "}
                {notifications.filter((n) => n.type === "due-soon").length} due soon
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  fontSize: 11,
                  color: "#1A4A35",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Dismiss all
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function ActionChip({ label }) {
  return (
    <button
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 6,
        background: "#F0EDE4",
        border: "1px solid #E2DAC8",
        color: "#1A4A35",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
