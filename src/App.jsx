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
import VATPage   from "./pages/VATPage.jsx";

import { INVOICES_DATA } from "./data/mockData.js";
import { supabase } from "./lib/supabase.js";

function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!businessName || !ownerName) {
        setError("All fields are required for signup.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        // Sign up with Supabase Auth
        const { data: { user }, error: signupError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              business_name: businessName,
              owner_name: ownerName
            }
          }
        });
        if (signupError) throw signupError;
        
        // Create profile using the returned user
        if (user) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: user.id,
            email,
            business_name: businessName,
            owner_name: ownerName,
          });
          if (profileError) {
            console.error("Profile creation error:", profileError);
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
          setError("✅ Account created! Check your email to confirm, then sign in.");
          // Reset form
          setEmail("");
          setPassword("");
          setBusinessName("");
          setOwnerName("");
          setTimeout(() => setIsSignUp(false), 2000);
        }
      } else {
        const { error: signinError } = await supabase.auth.signInWithPassword({ email, password });
        if (signinError) throw signinError;
      }
    } catch (err) {
      // Provide user-friendly error messages
      const errorMsg = err.message || "";
      if (errorMsg.includes("rate limit") || errorMsg.includes("too many")) {
        setError("Too many attempts. Please wait 60 seconds before trying again.");
      } else if (errorMsg.includes("already registered") || errorMsg.includes("User already exists")) {
        setError("This email is already registered. Try signing in instead.");
      } else if (errorMsg.includes("Invalid login") || errorMsg.includes("wrong")) {
        setError("Invalid email or password.");
      } else if (errorMsg.includes("Email not confirmed")) {
        setError("Please confirm your email first. Check your inbox for a confirmation link.");
      } else if (errorMsg.includes("Profile creation failed")) {
        setError(errorMsg);
      } else if (errorMsg.includes("duplicate key") || errorMsg.includes("profiles")) {
        setError("⚠️ Profile issue: " + errorMsg);
      } else {
        setError(errorMsg || "An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <form onSubmit={handleAuth} style={{
        background: "white",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h1 style={{ marginBottom: "20px", textAlign: "center" }}>
          SmartInvoice Africa
        </h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
          {isSignUp ? "Create your account" : "Sign in to your account"}
        </p>

        {error && (
          <div style={{
            padding: "10px",
            background: "#fee",
            color: "#c33",
            borderRadius: "4px",
            marginBottom: "15px"
          }}>
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            border: "1px solid #ddd",
            borderRadius: "4px"
          }}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            border: "1px solid #ddd",
            borderRadius: "4px"
          }}
          required
        />

        {isSignUp && (
          <>
            <input
              type="text"
              placeholder="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
              required
            />

            <input
              type="text"
              placeholder="Owner Name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
              required
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginBottom: "15px",
            fontWeight: "bold"
          }}
        >
          {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
        </button>

        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </form>
    </div>
  );
}

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

  // ── Page renderer ──
  const renderPage = () => {
    const props = { currency, invoices };
    switch (page) {
      case "dashboard": return <Dashboard {...props} setPage={setPage} />;
      case "invoices":  return <Invoices  {...props} setInvoices={setInvoices} />;
      case "expenses":  return <Expenses  currency={currency} />;
      case "customers": return <Customers currency={currency} />;
      case "reports":   return <Reports   {...props} />;
      case "vat":       return <VATPage   currency={currency} />;
      default:          return <Dashboard {...props} setPage={setPage} />;
    }
  };

  // ── Loading state ──
  if (authLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontSize: "18px"
      }}>
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
        <Sidebar page={page} setPage={setPage} setSideOpen={setSideOpen} />
      </div>

      {/* ── Main content ── */}
      <div className="main-wrap" style={{ marginLeft: 230 }}>
        <Topbar
          page={page}
          setSideOpen={setSideOpen}
          currency={currency}
          setCurrency={setCurrency}
          user={user}
        />
        <main>{renderPage()}</main>
      </div>
    </div>
  );
}
