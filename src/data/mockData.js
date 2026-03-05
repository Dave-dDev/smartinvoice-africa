// ── INVOICES ──────────────────────────────────────────────────────────────────
export const INVOICES_DATA = [
  { id: "INV-0047", client: "TechKing Solutions",      initials: "TK", color: "#2A6B4F", amount: 850000,  due: "2025-07-15", status: "overdue", email: "info@techking.ng",      phone: "+234 803 123 4567" },
  { id: "INV-0046", client: "Fola & Sons Enterprises", initials: "FS", color: "#C4522A", amount: 1200000, due: "2025-07-22", status: "viewed",  email: "fola@folasons.com",     phone: "+234 812 987 6543" },
  { id: "INV-0045", client: "MegaWorks Ltd",           initials: "MW", color: "#5A3A8A", amount: 450000,  due: "2025-07-10", status: "paid",    email: "accounts@megaworks.ng", phone: "+234 901 555 0011" },
  { id: "INV-0044", client: "Bayero Nig. Ltd",         initials: "BN", color: "#1A5A8A", amount: 320000,  due: "2025-07-28", status: "sent",    email: "bayero@bayeronig.com",  phone: "+234 708 222 3344" },
  { id: "INV-0043", client: "Greenstar Supplies",      initials: "GS", color: "#8A4A1A", amount: 675000,  due: "2025-07-05", status: "paid",    email: "green@greenstar.ng",    phone: "+234 816 777 8899" },
  { id: "INV-0042", client: "Apex Digital Ltd",        initials: "AD", color: "#3A6A9A", amount: 980000,  due: "2025-06-30", status: "overdue", email: "accounts@apexdigital.ng",phone: "+234 803 444 5566" },
  { id: "INV-0041", client: "Sunlight Farms",          initials: "SF", color: "#4A7A2A", amount: 215000,  due: "2025-07-18", status: "sent",    email: "info@sunlightfarms.ng", phone: "+234 911 222 9900" },
];

// ── EXPENSES ──────────────────────────────────────────────────────────────────
export const EXPENSES_DATA = [
  { id: 1, vendor: "Lagos Market Co.",  category: "Inventory", amount: 1900000, date: "2025-07-12", receipt: true,  notes: "Basmati Rice bulk purchase" },
  { id: 2, vendor: "DHL Nigeria",       category: "Transport", amount: 85000,   date: "2025-07-11", receipt: true,  notes: "Client delivery Abuja" },
  { id: 3, vendor: "Staff Salaries",    category: "Salaries",  amount: 300000,  date: "2025-07-01", receipt: false, notes: "July payroll" },
  { id: 4, vendor: "AEDC Electric",     category: "Utilities", amount: 45000,   date: "2025-07-08", receipt: true,  notes: "Power bill" },
  { id: 5, vendor: "Meta Ads",          category: "Marketing", amount: 80000,   date: "2025-07-10", receipt: false, notes: "Facebook campaign" },
  { id: 6, vendor: "UPS Logistics",     category: "Transport", amount: 65000,   date: "2025-07-09", receipt: true,  notes: "Kano delivery" },
  { id: 7, vendor: "Water Board",       category: "Utilities", amount: 18000,   date: "2025-07-05", receipt: false, notes: "Monthly water" },
  { id: 8, vendor: "Stock Depot",       category: "Inventory", amount: 420000,  date: "2025-07-14", receipt: true,  notes: "Restock items" },
];

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
export const CUSTOMERS_DATA = [
  { id: 1, name: "TechKing Solutions",      contact: "Emeka Obi",       email: "info@techking.ng",      city: "Lagos",         totalInvoiced: 3400000, lastInvoice: "2025-07-12", initials: "TK", color: "#2A6B4F" },
  { id: 2, name: "Fola & Sons Enterprises", contact: "Folake Adeyemi",  email: "fola@folasons.com",     city: "Abuja",         totalInvoiced: 2800000, lastInvoice: "2025-07-08", initials: "FS", color: "#C4522A" },
  { id: 3, name: "MegaWorks Ltd",           contact: "Chidi Nwosu",     email: "accounts@megaworks.ng", city: "Port Harcourt", totalInvoiced: 1200000, lastInvoice: "2025-07-01", initials: "MW", color: "#5A3A8A" },
  { id: 4, name: "Bayero Nig. Ltd",         contact: "Aminu Bayero",    email: "bayero@bayeronig.com",  city: "Kano",          totalInvoiced: 900000,  lastInvoice: "2025-06-28", initials: "BN", color: "#1A5A8A" },
  { id: 5, name: "Greenstar Supplies",      contact: "Ngozi Eze",       email: "green@greenstar.ng",    city: "Enugu",         totalInvoiced: 1875000, lastInvoice: "2025-07-05", initials: "GS", color: "#8A4A1A" },
];

// ── ACTIVITY ──────────────────────────────────────────────────────────────────
export const ACTIVITY = [
  { icon: "✅", bg: "#D4EDE3", text: "MegaWorks paid INV-0045 via Paystack",            time: "Today, 9:14 AM"    },
  { icon: "👁",  bg: "#FFF4D6", text: "Fola & Sons viewed INV-0046",                    time: "Today, 8:52 AM"    },
  { icon: "⏰", bg: "#FAE0D5", text: "Overdue reminder sent to TechKing via WhatsApp",  time: "Yesterday, 4:00 PM"},
  { icon: "📦", bg: "#D8EAF8", text: "Low stock: Basmati Rice 25kg (3 units left)",     time: "Yesterday, 1:18 PM"},
  { icon: "📄", bg: "#D4EDE3", text: "INV-0047 created for TechKing Solutions",         time: "Jul 12, 2025"      },
  { icon: "🧾", bg: "#FFF4D6", text: "VAT report exported for June 2025",               time: "Jul 10, 2025"      },
];

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
export const EXP_COLORS = {
  Inventory: "#C4522A",
  Transport: "#E8A020",
  Salaries:  "#1A7A50",
  Utilities: "#4AACB8",
  Marketing: "#A065C8",
};

export const STATUS_META = {
  paid:    { label: "Paid",    bg: "#D4EDE3", color: "#1A6A40" },
  overdue: { label: "Overdue", bg: "#FAE0D5", color: "#993A1A" },
  viewed:  { label: "Viewed",  bg: "#FFF4D6", color: "#996A10" },
  sent:    { label: "Sent",    bg: "#E4E8F0", color: "#4A5A7A" },
  draft:   { label: "Draft",   bg: "#EFEFEF", color: "#666"    },
};

export const AVATAR_COLORS = [
  "#2A6B4F", "#C4522A", "#5A3A8A",
  "#1A5A8A", "#8A4A1A", "#4A7A2A",
];

export const MONTHLY_REVENUE  = [1200000, 1800000, 1500000, 2200000, 2800000, 3100000, 4200000];
export const MONTHLY_EXPENSES = [800000,  1100000, 950000,  1300000, 1800000, 2100000, 2930000];
export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul"];

// ── HELPERS ───────────────────────────────────────────────────────────────────
export const fmt = (n, sym = "₦") => `${sym} ${(n || 0).toLocaleString("en-NG")}`;

export const currencySymbol = (cur) =>
  cur === "USD" ? "$" : cur === "KES" ? "KSh" : "₦";

export const makeInitials = (name = "") =>
  name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "??";
