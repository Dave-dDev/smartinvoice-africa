/**
 * SmartInvoice Africa — Login / Signup
 * Branded split-screen auth. Keeps all Supabase auth logic in one place.
 */

import { useState } from "react";
import { supabase } from "../lib/supabase.js";

const BRAND_POINTS = [
  { icon: "⚡", title: "Get paid faster", desc: "Send invoices and track payments in real time." },
  { icon: "🧾", title: "VAT & taxes handled", desc: "Country-accurate VAT rates across Africa." },
  { icon: "📊", title: "Know your health", desc: "Live business health score and cash flow." },
  { icon: "🌍", title: "Multi-currency", desc: "Invoice in NGN, KES, GHS or ZAR." },
];

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", businessName: "", ownerName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (error) setError("");
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setForm({ email: "", password: "", businessName: "", ownerName: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ── Validation ──
    if (!form.email || !form.password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }
    if (mode === "signup") {
      if (!form.businessName || !form.ownerName) {
        setError("All fields are required for signup.");
        setLoading(false);
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === "signup") {
        const { data: { user }, error: signupError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { business_name: form.businessName, owner_name: form.ownerName },
          },
        });
        if (signupError) throw signupError;

        if (user) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: user.id,
            email: form.email,
            business_name: form.businessName,
            owner_name: form.ownerName,
          });
          if (profileError) {
            console.error("Profile creation error:", profileError);
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
          setError("✅ Account created! Check your email to confirm, then sign in.");
          setForm({ email: "", password: "", businessName: "", ownerName: "" });
          setTimeout(() => switchMode("login"), 2200);
          setLoading(false);
          return;
        }
      } else {
        const { error: signinError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signinError) throw signinError;
      }
    } catch (err) {
      console.error("Signup/Signin error:", err);
      setError(friendlyError(err.message || "An error occurred. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const friendlyError = (msg) => {
    if (/rate limit|too many/i.test(msg)) return "Too many attempts. Please wait 60 seconds before trying again.";
    if (/already registered|already exists/i.test(msg)) return "This email is already registered. Try signing in instead.";
    if (/invalid login|wrong|invalid credentials/i.test(msg)) return "Invalid email or password.";
    if (/not confirmed/i.test(msg)) return "Please confirm your email first. Check your inbox for a confirmation link.";
    if (/profile creation failed/i.test(msg)) return msg;
    if (/duplicate key|profiles/i.test(msg)) return "⚠️ Profile issue: " + msg;
    return msg;
  };

  return (
    <div className="auth-page">
      {/* ── Brand panel ── */}
      <div className="auth-brand">
        <div className="auth-brand-bg" aria-hidden="true" />

        <div className="auth-brand-inner fade-up">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-mark">₦</div>
            <div>
              <div className="auth-logo-name">SmartInvoice</div>
              <div className="auth-logo-sub">AFRICA</div>
            </div>
          </div>

          {/* Headline */}
          <div className="auth-headline">
            Run your African SME
            <br />
            like a <span>big business</span>.
          </div>
          <p className="auth-tagline">
            Invoice, track and get paid — beautifully simple financial tools built
            for growing businesses across the continent.
          </p>

          {/* Feature points */}
          <div className="auth-points">
            {BRAND_POINTS.map((p) => (
              <div className="auth-point" key={p.title}>
                <div className="auth-point-icon">{p.icon}</div>
                <div>
                  <div className="auth-point-title">{p.title}</div>
                  <div className="auth-point-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust footer */}
          <div className="auth-trust">
            <span className="auth-trust-dot" /> Trusted by SMEs in Nigeria · Kenya · Ghana · South Africa
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="auth-form-wrap">
        <div className="auth-card fade-up">
          {/* Header */}
          <h1 className="auth-title">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Sign in to manage your invoices and cash flow."
              : "Start invoicing in under a minute — free to begin."}
          </p>

          {/* Mode toggle */}
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "auth-tab active" : "auth-tab"}
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "signup" ? "auth-tab active" : "auth-tab"}
              onClick={() => switchMode("signup")}
            >
              Sign up
            </button>
          </div>

          {error && (
            <div className={`auth-error ${error.startsWith("✅") ? "ok" : ""}`}>{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <>
                <label className="field-label" htmlFor="auth-business">Business name *</label>
                <input
                  id="auth-business"
                  className="field-input"
                  placeholder="e.g. Adebayo Traders Ltd"
                  value={form.businessName}
                  onChange={set("businessName")}
                  required
                />

                <label className="field-label" htmlFor="auth-owner">Your full name *</label>
                <input
                  id="auth-owner"
                  className="field-input"
                  placeholder="e.g. Amina Adebayo"
                  value={form.ownerName}
                  onChange={set("ownerName")}
                  required
                />
              </>
            )}

            <label className="field-label" htmlFor="auth-email">Work email</label>
            <input
              id="auth-email"
              type="email"
              className="field-input"
              placeholder="you@business.com"
              value={form.email}
              onChange={set("email")}
              required
            />

            <label className="field-label" htmlFor="auth-password">Password</label>
            <div className="auth-pw">
              <input
                id="auth-password"
                type={showPw ? "text" : "password"}
                className="field-input"
                placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                value={form.password}
                onChange={set("password")}
                required
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? "🙈" : "👁"}
              </button>
            </div>

            {mode === "login" && (
              <div className="auth-forgot">
                <span>Forgot password?</span>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" aria-hidden="true" />
              ) : mode === "login" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="auth-legal">
            By continuing you agree to our <span>Terms</span> &amp; <span>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
