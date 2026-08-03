/**
 * SmartInvoice Africa — App Root
 * Wires together all pages, sidebar, topbar, and global state.
 */

import { useState, useEffect } from "react";

import "./styles/global.css";

import Sidebar   from "./components/Sidebar.jsx";
import Topbar    from "./components/Topbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Invoices  from "./pages/Invoices.jsx";
import Expenses  from "./pages/Expenses.jsx";
import Customers from "./pages/Customers.jsx";
import Reports   from "./pages/Reports.jsx";
import FinancialStatements from "./pages/FinancialStatements.jsx";
import VATPage   from "./pages/VATPage.jsx";
import FinancialAnalysis from "./pages/FinancialAnalysis.jsx";
import Settings         from "./pages/Settings.jsx";

import { INVOICES_DATA } from "./data/mockData.js";
import { supabase } from "./lib/supabase.js";
import AuthPage from "./components/AuthPage.jsx";
import { ensureDefaultChart } from "./services/ledgerService.js";

export default function App() {
  // ── Auth state ──
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Global state ──
  const [page,     setPage]     = useState("dashboard");
  const [currency, setCurrency] = useState("NGN");
  const [sideOpen, setSideOpen] = useState(false);
  const [invoices, setInvoices] = useState(INVOICES_DATA);

  // ── Auth effect ──
  useEffect(() => {
    // Get session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  // Seed the default chart of accounts once a user signs in (fire-and-forget)
  useEffect(() => {
    if (user) {
      ensureDefaultChart(user.id).catch((e) =>
        console.warn("Chart of accounts seeding failed:", e.message)
      );
    }
  }, [user]);

  // ── Page renderer ──
  const renderPage = () => {
    const props = { currency, invoices };
    switch (page) {
      case "dashboard":          return <Dashboard {...props} setInvoices={setInvoices} setPage={setPage} />;
      case "invoices":           return <Invoices  {...props} setInvoices={setInvoices} />;
      case "expenses":           return <Expenses  currency={currency} />;
      case "customers":          return <Customers currency={currency} invoices={invoices} />;
      case "reports":            return <Reports   {...props} />;
      case "financial-statements": return <FinancialStatements currency={currency} />;
      case "vat":                return <VATPage   currency={currency} />;
      case "financial-analysis": return <FinancialAnalysis currency={currency} />;
      case "settings":            return <Settings currency={currency} setCurrency={setCurrency} />;
      default:                   return <Dashboard {...props} setInvoices={setInvoices} setPage={setPage} />;
    }
  };

  // ── Loading state ──
  if (authLoading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        height: "100vh",
        background: "linear-gradient(160deg, #12382A 0%, #1A4A35 55%, #2A6B4F 100%)",
        color: "white",
        fontSize: "18px",
        fontFamily: "Syne, sans-serif"
      }}>
        <div style={{
          width: 48,
          height: 48,
          background: "#E8A020",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 22,
          color: "#0D0D0D"
        }}>
          ₦
        </div>
        Loading…
      </div>
    );
  }

  // ── Not authenticated ──
  if (!user) {
    return <AuthPage />;
  }

  // ── Authenticated ──
  return (
    <div className="app-shell">
      {/* ── Mobile overlay ── */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", zIndex:89 }}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        style={{
          position: "fixed",
          left: 0, top: 0, bottom: 0,
          zIndex: 90,
          transform: sideOpen ? "translateX(0)" : undefined,
        }}
        className={sideOpen ? "sidebar-open" : ""}
      >
        <Sidebar page={page} setPage={setPage} setSideOpen={setSideOpen} invoices={invoices} />
      </div>

      {/* ── Main content ── */}
      <div className="main-wrap" style={{ marginLeft: 230 }}>
        <Topbar
          page={page}
          setSideOpen={setSideOpen}
          currency={currency}
          setCurrency={setCurrency}
          user={user}
          invoices={invoices}
          setPage={setPage}
        />
        <main>{renderPage()}</main>
      </div>
    </div>
  );
}
