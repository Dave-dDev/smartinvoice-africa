# SmartInvoice Africa 🌍

> Smart Invoice & Expense Manager for African SMEs  
> Built with React + Vite

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# → http://localhost:5173
```

## Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
smartinvoice-africa/
├── index.html                   # HTML entry point
├── package.json                 # Dependencies & scripts
├── vite.config.js               # Vite configuration
└── src/
    ├── index.jsx                # React root / mount
    ├── App.jsx                  # App shell, routing, global state
    │
    ├── data/
    │   └── mockData.js          # All mock data, constants & helpers
    │
    ├── styles/
    │   └── global.css           # Global CSS, design tokens, layouts
    │
    ├── components/
    │   ├── UI.jsx               # Shared UI: Avatar, Badge, Btn, Panel, Modal, Input…
    │   ├── Sidebar.jsx          # Left navigation sidebar
    │   └── Topbar.jsx           # Top header bar
    │
    └── pages/
        ├── Dashboard.jsx        # KPI overview, cash flow, activity feed
        ├── Invoices.jsx         # Invoice table, create/view modals
        ├── Expenses.jsx         # Expense table, category breakdown
        ├── Customers.jsx        # Customer cards, add/view modals
        ├── Reports.jsx          # Revenue charts, export reports
        └── VATPage.jsx          # VAT rates by country, WHT tracker
```

---

## Features (MVP)

| Feature | Status |
|---|---|
| Multi-page navigation (6 pages) | ✅ |
| Create & send invoices with line items | ✅ |
| VAT toggle (7.5% Nigeria) | ✅ |
| Invoice status tracking (sent / viewed / paid / overdue) | ✅ |
| WhatsApp reminder CTA | ✅ |
| Paystack / Bank Transfer / Mobile Money options | ✅ |
| Expense tracking with categories | ✅ |
| OCR receipt scanner callout | ✅ |
| Cash flow snapshot (receivables vs payables) | ✅ |
| Top debtors widget | ✅ |
| Multi-currency toggle (NGN / KES / USD) | ✅ |
| Customer CRM cards | ✅ |
| Revenue vs Expenses bar chart | ✅ |
| VAT rates for NG, KE, GH, ZA | ✅ |
| WHT vendor tracker | ✅ |
| PDF export buttons | ✅ |

---

## Tech Stack

- **React 18** — UI framework  
- **Vite 5** — Build tool & dev server  
- **No UI library** — 100% custom, hand-crafted components  
- **Fonts**: Syne (display) + DM Sans (body) via Google Fonts  
- **Color palette**: Forest green · Gold · Terracotta · Ivory  

---

## Roadmap (Phase 2)

- [ ] Offline-first with Service Worker + IndexedDB sync  
- [ ] Paystack & Flutterwave live API integration  
- [ ] Real NUBAN virtual account generation  
- [ ] WhatsApp Business API reminders  
- [ ] Inventory management (low-stock alerts)  
- [ ] Invoice financing / lending integration  
- [ ] Team roles (Accountant, Salesperson, Manager)  
