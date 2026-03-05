/**
 * SmartInvoice Africa — Shared UI Components
 * Avatar, Badge, Btn, Panel, PanelHeader, Modal, Input, Select
 */

import { STATUS_META } from "../data/mockData.js";

// ── AVATAR ────────────────────────────────────────────────────────────────────
export function Avatar({ initials, color, size = 36 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.25),
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Syne, sans-serif",
        fontWeight: 700,
        fontSize: Math.round(size * 0.34),
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
export function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 20,
        background: m.bg,
        color: m.color,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        whiteSpace: "nowrap",
      }}
    >
      {m.label}
    </span>
  );
}

// ── BUTTON ────────────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  gold:    { background: "#E8A020", color: "#0D0D0D",  border: "none" },
  forest:  { background: "#1A4A35", color: "#fff",     border: "none" },
  outline: { background: "transparent", color: "#1A4A35", border: "1.5px solid #1A4A35" },
  ghost:   { background: "rgba(0,0,0,0.04)", color: "#444", border: "none" },
  danger:  { background: "#FAE0D5", color: "#993A1A",  border: "none" },
  white:   { background: "#fff",    color: "#1A4A35",  border: "none" },
};

export function Btn({ children, variant = "gold", onClick, style = {}, small = false, disabled = false }) {
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.ghost;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: small ? "7px 14px" : "10px 18px",
        borderRadius: 9,
        fontFamily: "DM Sans, sans-serif",
        fontSize: small ? 12 : 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all .18s",
        opacity: disabled ? 0.5 : 1,
        ...v,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── PANEL ─────────────────────────────────────────────────────────────────────
export function Panel({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#FDFAF4",
        border: "1px solid #E2DAC8",
        borderRadius: 14,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── PANEL HEADER ──────────────────────────────────────────────────────────────
export function PanelHeader({ title, action, onAction }) {
  return (
    <div
      style={{
        padding: "16px 22px",
        borderBottom: "1px solid #E2DAC8",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span
        style={{
          fontFamily: "Syne, sans-serif",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {title}
      </span>
      {action && (
        <span
          onClick={onAction}
          style={{
            fontSize: 12,
            color: "#1A4A35",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {action}
        </span>
      )}
    </div>
  );
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 540 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FDFAF4",
          borderRadius: 16,
          width: "100%",
          maxWidth,
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,.18)",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E2DAC8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            background: "#FDFAF4",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {title}
          </span>
          <span
            onClick={onClose}
            style={{ cursor: "pointer", fontSize: 22, lineHeight: 1, color: "#888" }}
          >
            ×
          </span>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── TEXT INPUT ────────────────────────────────────────────────────────────────
export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  style = {},
}) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <label className="field-label">
        {label}
        {required && " *"}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="field-input"
      />
    </div>
  );
}

// ── SELECT ────────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="field-label">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="field-input"
        style={{ cursor: "pointer" }}
      >
        {options.map((o) => {
          const val   = typeof o === "object" ? o.value : o;
          const lbl   = typeof o === "object" ? o.label : o;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </div>
  );
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, trend, trendColor, accent }) {
  return (
    <div
      className="fade-up"
      style={{
        background: "#FDFAF4",
        border: "1px solid #E2DAC8",
        borderTop: `3px solid ${accent}`,
        borderRadius: 12,
        padding: "18px 18px",
        transition: "transform .2s, box-shadow .2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform  = "translateY(-2px)";
        e.currentTarget.style.boxShadow  = "0 8px 24px rgba(0,0,0,.07)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform  = "";
        e.currentTarget.style.boxShadow  = "";
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 8 }}>{icon}</div>
      <div
        style={{
          fontSize: 10.5,
          color: "#6B6455",
          textTransform: "uppercase",
          letterSpacing: 0.7,
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Syne, sans-serif",
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: trendColor }}>{trend}</div>
    </div>
  );
}

// ── SECTION TITLE ─────────────────────────────────────────────────────────────
export function SectionTitle({ children }) {
  return (
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
      {children}
    </div>
  );
}
