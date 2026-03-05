/**
 * SmartInvoice Africa — VAT & Taxes Page
 */

import { Btn, Panel, PanelHeader } from "../components/UI.jsx";
import { fmt, currencySymbol } from "../data/mockData.js";

const COUNTRIES = [
  { name:"Nigeria 🇳🇬",      vat:"7.5%",  wht:"5–10%", desc:"FIRS · Monthly filing",    liability: 930000 },
  { name:"Kenya 🇰🇪",        vat:"16%",   wht:"5%",    desc:"KRA · Monthly filing",     liability: 0      },
  { name:"Ghana 🇬🇭",        vat:"12.5%", wht:"8%",    desc:"GRA · Quarterly",          liability: 0      },
  { name:"South Africa 🇿🇦", vat:"15%",   wht:"20%",   desc:"SARS · Bi-monthly",        liability: 0      },
];

const WHT_VENDORS = [
  { vendor:"TechKing Solutions", service:"Consulting",  rate:"10%", inv:850000,  wht:85000,  filed:false },
  { vendor:"Greenstar Supplies", service:"Supply",      rate:"5%",  inv:675000,  wht:33750,  filed:true  },
  { vendor:"MegaWorks Ltd",      service:"Construction",rate:"5%",  inv:450000,  wht:22500,  filed:true  },
];

export default function VATPage({ currency }) {
  const sym = currencySymbol(currency);

  return (
    <div className="page-content">
      {/* ── Country grid ── */}
      <div className="grid-2" style={{ marginBottom:20 }}>
        {COUNTRIES.map((c, i) => (
          <CountryCard key={i} country={c} sym={sym} />
        ))}
      </div>

      {/* ── WHT Vendor Tracker ── */}
      <Panel>
        <PanelHeader title="WHT Vendor Tracker" />
        <table className="data-table">
          <thead>
            <tr>
              {["Vendor","Service Type","WHT Rate","Invoice Amt","WHT Withheld","Status"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WHT_VENDORS.map((r, i) => (
              <tr key={i}>
                <td style={{ fontSize:13, fontWeight:500 }}>{r.vendor}</td>
                <td style={{ fontSize:12.5, color:"#6B6455" }}>{r.service}</td>
                <td style={{ fontFamily:"Syne,sans-serif", fontWeight:700, color:"#E8A020" }}>{r.rate}</td>
                <td style={{ fontFamily:"Syne,sans-serif", fontWeight:700 }}>{fmt(r.inv, sym)}</td>
                <td style={{ fontFamily:"Syne,sans-serif", fontWeight:700, color:"#C4522A" }}>{fmt(r.wht, sym)}</td>
                <td>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20, background:r.filed ? "#D4EDE3" : "#FAE0D5", color:r.filed ? "#1A6A40" : "#993A1A" }}>
                    {r.filed ? "Filed" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding:"14px 20px", borderTop:"1px solid #E2DAC8", display:"flex", justifyContent:"flex-end" }}>
          <Btn variant="forest" small>⬇ Export WHT Report (PDF)</Btn>
        </div>
      </Panel>
    </div>
  );
}

// ── Country Card ──────────────────────────────────────────────────────────────
function CountryCard({ country: c, sym }) {
  return (
    <Panel>
      <div style={{ padding:"18px 20px" }}>
        <div style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:700, marginBottom:12 }}>{c.name}</div>

        {/* Rate boxes */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          <RateBox label="VAT Rate" value={c.vat} bg="#FFF4D6" color="#996A10" />
          <RateBox label="WHT Rate" value={c.wht} bg="#D8EAF8" color="#1A5A8A" />
        </div>

        <div style={{ fontSize:12, color:"#6B6455", marginBottom:12 }}>📋 {c.desc}</div>

        {/* Liability badge */}
        {c.liability > 0 ? (
          <div style={{ background:"#FAE0D5", border:"1px solid #F5C4B0", borderRadius:9, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"#993A1A" }}>⚠ Outstanding VAT</div>
              <div style={{ fontSize:10.5, color:"#6B6455", marginTop:1 }}>Due Sep 21, 2025</div>
            </div>
            <div style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:700, color:"#993A1A" }}>{fmt(c.liability, sym)}</div>
          </div>
        ) : (
          <div style={{ background:"#D4EDE3", borderRadius:9, padding:"10px 14px", fontSize:12, color:"#1A6A40", fontWeight:500 }}>
            ✅ No outstanding liability
          </div>
        )}
      </div>
    </Panel>
  );
}

function RateBox({ label, value, bg, color }) {
  return (
    <div style={{ background:bg, borderRadius:9, padding:"12px 14px" }}>
      <div style={{ fontSize:10.5, color:"#6B6455", textTransform:"uppercase", letterSpacing:".6px", marginBottom:4 }}>{label}</div>
      <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:700, color }}>{value}</div>
    </div>
  );
}
