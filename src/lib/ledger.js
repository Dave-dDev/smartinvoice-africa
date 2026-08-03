/**
 * SmartInvoice Africa — Double-Entry Ledger Engine
 * Pure, framework-free accounting functions.
 *
 * Model:
 *   - DEFAULT_CHART_OF_ACCOUNTS   the default chart each profile gets seeded with
 *   - buildLedger(invoices, expenses)  derives balanced journal entries from the
 *       app's invoice + expense data (works with both mock and Supabase shapes)
 *   - computeProfitAndLoss / computeBalanceSheet / computeCashFlow  generate the
 *       three core financial statements from those entries
 *
 * Posting rules (accrual basis):
 *   - Invoice issued (sent/viewed/overdue): DR Accounts Receivable, CR Sales Revenue,
 *     CR VAT Payable (if the invoice carries VAT)
 *   - Invoice paid:                      DR Bank & Cash, CR Accounts Receivable
 *   - Expense recorded:                  DR expense account (by category), CR Bank & Cash
 */

export const ACCOUNT_TYPES = ["asset", "liability", "equity", "income", "expense"];

export const DEFAULT_CHART_OF_ACCOUNTS = [
  { code: "1000", name: "Assets",            type: "asset",     category: "Operating" },
  { code: "1100", name: "Bank & Cash",       type: "asset",     category: "Operating" },
  { code: "1200", name: "Accounts Receivable", type: "asset",   category: "Operating" },
  { code: "2000", name: "Liabilities",       type: "liability", category: "Operating" },
  { code: "2100", name: "Accounts Payable",  type: "liability", category: "Operating" },
  { code: "2200", name: "VAT Payable",       type: "liability", category: "Tax"      },
  { code: "2300", name: "WHT Payable",       type: "liability", category: "Tax"      },
  { code: "3000", name: "Equity",            type: "equity",    category: "Operating" },
  { code: "3100", name: "Owner's Equity",    type: "equity",    category: "Operating" },
  { code: "4000", name: "Income",            type: "income",    category: "Operating" },
  { code: "4100", name: "Sales Revenue",     type: "income",    category: "Operating" },
  { code: "4200", name: "Other Income",      type: "income",    category: "Operating" },
  { code: "5000", name: "Expenses",          type: "expense",   category: "Operating" },
  { code: "5100", name: "Cost of Goods Sold", type: "expense",  category: "Operating" },
  { code: "5200", name: "Salaries & Wages",  type: "expense",   category: "Operating" },
  { code: "5300", name: "Rent & Property",   type: "expense",   category: "Operating" },
  { code: "5400", name: "Utilities",         type: "expense",   category: "Operating" },
  { code: "5500", name: "Transport & Logistics", type: "expense", category: "Operating" },
  { code: "5600", name: "Marketing & Advertising", type: "expense", category: "Operating" },
  { code: "5700", name: "Other Operating Expenses", type: "expense", category: "Operating" },
];

// Maps expense categories to the account code that absorbs the expense
export const EXPENSE_CATEGORY_TO_ACCOUNT = {
  Inventory: "5100",
  Supplies: "5100",
  COGS: "5100",
  Salaries: "5200",
  Payroll: "5200",
  Rent: "5300",
  Utilities: "5400",
  Transport: "5500",
  Logistics: "5500",
  Marketing: "5600",
  Advertising: "5600",
};

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function toNumber(v) {
  return Number(v) || 0;
}

// ── Normalisers (accept mock + Supabase shapes) ───────────────────────────────
export function normalizeInvoice(inv) {
  const subtotal = toNumber(inv.subtotal ?? inv.amount);
  const vat = toNumber(inv.vat ?? inv.vat_amount ?? 0);
  const total = toNumber(inv.total ?? inv.amount ?? subtotal + vat);
  return {
    id: inv.id ?? inv.invoice_number ?? "invoice",
    date: inv.date ?? inv.created_at ?? inv.issued_date,
    dueDate: inv.due ?? inv.due_date,
    status: inv.status ?? "draft",
    subtotal,
    vat,
    total,
    customer: inv.customer_name ?? inv.client ?? "—",
    number: inv.invoice_number ?? inv.id ?? "—",
  };
}

export function normalizeExpense(exp) {
  return {
    id: exp.id ?? "expense",
    date: exp.date ?? exp.expense_date ?? exp.created_at,
    amount: toNumber(exp.amount),
    category: exp.category ?? "Other",
    vendor: exp.vendor ?? "—",
  };
}

// ── Entry builders ────────────────────────────────────────────────────────────
function acc(code) {
  return { accountCode: code };
}

export function invoiceIssueEntry(inv) {
  const { subtotal, vat, total, date } = normalizeInvoice(inv);
  const lines = [{ ...acc("1200"), debit: total, credit: 0 }];
  if (vat > 0) lines.push({ ...acc("2200"), debit: 0, credit: vat });
  lines.push({ ...acc("4100"), debit: 0, credit: subtotal });
  return {
    date,
    sourceType: "invoice",
    sourceId: String(inv.id ?? ""),
    reference: inv.invoice_number ?? inv.id ?? "",
    description: `Invoice issued — ${normalizeInvoice(inv).customer}`,
    lines,
  };
}

export function invoicePaymentEntry(inv) {
  const { total, date } = normalizeInvoice(inv);
  return {
    date,
    sourceType: "payment",
    sourceId: String(inv.id ?? ""),
    reference: inv.invoice_number ?? inv.id ?? "",
    description: `Payment received — ${normalizeInvoice(inv).customer}`,
    lines: [
      { ...acc("1100"), debit: total, credit: 0 },
      { ...acc("1200"), debit: 0, credit: total },
    ],
  };
}

export function expenseEntry(exp) {
  const n = normalizeExpense(exp);
  const accountCode = EXPENSE_CATEGORY_TO_ACCOUNT[n.category] || "5700";
  return {
    date: n.date,
    sourceType: "expense",
    sourceId: String(exp.id ?? ""),
    reference: String(exp.id ?? ""),
    description: `${n.category} expense — ${n.vendor}`,
    lines: [
      { ...acc(accountCode), debit: n.amount, credit: 0 },
      { ...acc("1100"), debit: 0, credit: n.amount },
    ],
  };
}

// ── Ledger builder ────────────────────────────────────────────────────────────
const ISSUED_STATUSES = ["sent", "viewed", "overdue", "paid"];

/**
 * Derive balanced journal entries from invoices and expenses.
 * @returns {Array<{date, sourceType, sourceId, reference, description, lines}>}
 */
export function buildLedger(invoices = [], expenses = []) {
  const entries = [];

  (invoices || []).forEach((inv) => {
    const status = (inv.status ?? "draft").toLowerCase();
    if (ISSUED_STATUSES.includes(status)) {
      entries.push(invoiceIssueEntry(inv));
    }
    if (status === "paid") {
      entries.push(invoicePaymentEntry(inv));
    }
  });

  (expenses || []).forEach((exp) => {
    entries.push(expenseEntry(exp));
  });

  return entries.sort((a, b) => {
    const da = a.date ? new Date(a.date) : new Date(0);
    const db = b.date ? new Date(b.date) : new Date(0);
    return da - db;
  });
}

/**
 * Reduce a set of entries into per-account balances.
 * @returns {Map<string, {debit:number, credit:number, balance:number}>}
 */
export function computeTrialBalance(entries, { from, to } = {}) {
  const trial = new Map();
  (entries || []).forEach((entry) => {
    const d = entry.date ? new Date(entry.date) : null;
    if (from && (!d || d < new Date(from))) return;
    if (to && (!d || d > new Date(to))) return;
    entry.lines.forEach((line) => {
      const row = trial.get(line.accountCode) || { debit: 0, credit: 0, balance: 0 };
      row.debit = round2(row.debit + toNumber(line.debit));
      row.credit = round2(row.credit + toNumber(line.credit));
      row.balance = round2(row.debit - row.credit);
      trial.set(line.accountCode, row);
    });
  });
  return trial;
}

function accountMeta(code) {
  return (
    DEFAULT_CHART_OF_ACCOUNTS.find((a) => a.code === code) || {
      code,
      name: `Account ${code}`,
      type: "asset",
      category: "Operating",
    }
  );
}

function balanceWithSign(row, type) {
  // Assets/expenses carry natural debit; liabilities/equity/income carry natural credit
  const naturalDebit = type === "asset" || type === "expense";
  return naturalDebit ? round2(row.debit - row.credit) : round2(row.credit - row.debit);
}

// ── Financial statements ──────────────────────────────────────────────────────
/**
 * Profit & Loss (Income Statement) for a period.
 * @returns {{ revenue, expenses, grossProfit, netProfit, sections: Array }}
 */
export function computeProfitAndLoss(entries, { from, to } = {}) {
  const trial = computeTrialBalance(entries, { from, to });

  const incomeAccounts = DEFAULT_CHART_OF_ACCOUNTS.filter((a) => a.type === "income");
  const expenseAccounts = DEFAULT_CHART_OF_ACCOUNTS.filter((a) => a.type === "expense");

  const revenue = [];
  const expenses = [];

  incomeAccounts.forEach((a) => {
    const row = trial.get(a.code);
    if (row && row.credit - row.debit !== 0) {
      revenue.push({ code: a.code, name: a.name, amount: balanceWithSign(row, "income") });
    }
  });

  expenseAccounts.forEach((a) => {
    const row = trial.get(a.code);
    if (row && row.debit - row.credit !== 0) {
      expenses.push({ code: a.code, name: a.name, amount: balanceWithSign(row, "expense") });
    }
  });

  const totalRevenue = round2(revenue.reduce((s, r) => s + r.amount, 0));
  const totalExpenses = round2(expenses.reduce((s, e) => s + e.amount, 0));

  return {
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    grossProfit: round2(totalRevenue - totalExpenses),
    netProfit: round2(totalRevenue - totalExpenses),
  };
}

/**
 * Balance Sheet as of the latest entry date.
 * Equity includes retained earnings (net income) so assets == liabilities + equity.
 * @returns {{ assets, liabilities, equity, sections }}
 */
export function computeBalanceSheet(entries) {
  const trial = computeTrialBalance(entries);

  const assets = [];
  const liabilities = [];
  const equity = [];

  DEFAULT_CHART_OF_ACCOUNTS.forEach((a) => {
    const row = trial.get(a.code);
    const amount = row ? balanceWithSign(row, a.type) : 0;
    if (a.type === "asset") assets.push({ code: a.code, name: a.name, amount });
    if (a.type === "liability") liabilities.push({ code: a.code, name: a.name, amount });
    if (a.type === "equity") equity.push({ code: a.code, name: a.name, amount });
  });

  const pnl = computeProfitAndLoss(entries);
  const retainedEarnings = pnl.netProfit;
  if (retainedEarnings !== 0) {
    equity.push({ code: "3200", name: "Retained Earnings", amount: retainedEarnings });
  }

  const totalAssets = round2(assets.reduce((s, a) => s + a.amount, 0));
  const totalLiabilities = round2(liabilities.reduce((s, l) => s + l.amount, 0));
  const totalEquity = round2(equity.reduce((s, e) => s + e.amount, 0));

  return {
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    balanced: round2(totalAssets - totalLiabilities - totalEquity) === 0,
  };
}

/**
 * Cash Flow statement — derives from net movement in the Bank & Cash account.
 * @returns {{ operatingInflows, operatingOutflows, netCashFlow, operating: Array }}
 */
export function computeCashFlow(entries, { from, to } = {}) {
  const trial = computeTrialBalance(entries, { from, to });
  const bank = trial.get("1100");

  const operating = [];
  (entries || []).forEach((entry) => {
    const d = entry.date ? new Date(entry.date) : null;
    if (from && (!d || d < new Date(from))) return;
    if (to && (!d || d > new Date(to))) return;
    const bankLine = (entry.lines || []).find((l) => l.accountCode === "1100");
    if (!bankLine) return;
    const inflow = round2(bankLine.debit);
    const outflow = round2(bankLine.credit);
    if (inflow === 0 && outflow === 0) return;
    operating.push({
      date: entry.date,
      description: entry.description,
      inflow,
      outflow,
      net: round2(inflow - outflow),
    });
  });

  const totalInflows = round2(operating.reduce((s, o) => s + o.inflow, 0));
  const totalOutflows = round2(operating.reduce((s, o) => s + o.outflow, 0));

  return {
    operating,
    totalInflows,
    totalOutflows,
    netCashFlow: round2((bank ? bank.debit - bank.credit : 0) * 1),
    netOperatingCashFlow: round2(totalInflows - totalOutflows),
    investingInflows: 0,
    investingOutflows: 0,
    financingInflows: 0,
    financingOutflows: 0,
  };
}

/**
 * Convenience: full statement bundle for a data set.
 */
export function buildStatements(invoices = [], expenses = [], { from, to } = {}) {
  const entries = buildLedger(invoices, expenses);
  return {
    entries,
    trialBalance: computeTrialBalance(entries, { from, to }),
    profitAndLoss: computeProfitAndLoss(entries, { from, to }),
    balanceSheet: computeBalanceSheet(entries),
    cashFlow: computeCashFlow(entries, { from, to }),
  };
}

export function formatNumber(n, currency = "NGN") {
  const symbols = { NGN: "₦", KES: "KSh", GHS: "₵", ZAR: "R", USD: "$" };
  const sym = symbols[currency] || (currency ? currency + " " : "");
  return (
    sym +
    Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })
  );
}
