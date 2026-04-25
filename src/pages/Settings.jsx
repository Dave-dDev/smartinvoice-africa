/**
 * SmartInvoice Africa — Settings Page
 */

import { useState, useEffect } from "react";
import { Btn, Panel, PanelHeader, Input, Select } from "../components/UI.jsx";
import { supabase } from "../lib/supabase.js";

const CURRENCIES = [
  { value: "NGN", label: "🇳🇬 Nigerian Naira (NGN)" },
  { value: "KES", label: "🇰🇪 Kenyan Shilling (KES)" },
  { value: "GHS", label: "🇬🇭 Ghanaian Cedi (GHS)" },
  { value: "ZAR", label: "🇿🇦 South African Rand (ZAR)" },
  { value: "USD", label: "🇺🇸 US Dollar (USD)" },
];

export default function Settings({ currency, setCurrency }) {
  const [profile, setProfile] = useState({ business_name: "", owner_name: "", email: "" });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");
  const [signOutLoading, setSignOutLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setProfile({ business_name: data.business_name || "", owner_name: data.owner_name || "", email: user.email || "" });
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: err } = await supabase.from("profiles").update({
        business_name: profile.business_name,
        owner_name:    profile.owner_name,
      }).eq("id", user.id);
      if (err) throw err;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally { setSaving(false); }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    await supabase.auth.signOut();
  };

  return (
    <div className="page-content" style={{ maxWidth: 640 }}>
      {/* Profile */}
      <Panel style={{ marginBottom: 20 }}>
        <PanelHeader title="👤 Business Profile" />
        <div style={{ padding: "20px 24px" }}>
          <Input
            label="Business Name"
            value={profile.business_name}
            onChange={(e) => setProfile((p) => ({ ...p, business_name: e.target.value }))}
            placeholder="e.g. Adebayo Traders Ltd"
          />
          <Input
            label="Owner / Contact Name"
            value={profile.owner_name}
            onChange={(e) => setProfile((p) => ({ ...p, owner_name: e.target.value }))}
            placeholder="Full name"
          />
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Email Address</label>
            <input value={profile.email} disabled className="field-input" style={{ opacity: 0.6, cursor: "not-allowed" }} />
            <div style={{ fontSize: 11, color: "#6B6455", marginTop: 4 }}>Email cannot be changed here.</div>
          </div>

          {error  && <div style={{ padding: "9px 12px", background: "#FAE0D5", color: "#993A1A", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {saved  && <div style={{ padding: "9px 12px", background: "#D4EDE3", color: "#1A6A40", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>✅ Profile saved!</div>}

          <Btn variant="forest" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "💾 Save Profile"}
          </Btn>
        </div>
      </Panel>

      {/* Currency */}
      <Panel style={{ marginBottom: 20 }}>
        <PanelHeader title="💱 Default Currency" />
        <div style={{ padding: "20px 24px" }}>
          <Select
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={CURRENCIES}
          />
          <div style={{ fontSize: 12, color: "#6B6455" }}>
            This affects how amounts are displayed across the app.
          </div>
        </div>
      </Panel>

      {/* Danger zone */}
      <Panel>
        <PanelHeader title="⚠️ Account" />
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 13, color: "#6B6455", marginBottom: 14 }}>
            Sign out from SmartInvoice Africa on this device.
          </div>
          <Btn variant="danger" onClick={handleSignOut} disabled={signOutLoading}>
            {signOutLoading ? "Signing out…" : "🔒 Sign Out"}
          </Btn>
        </div>
      </Panel>
    </div>
  );
}
