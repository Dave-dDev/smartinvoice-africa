/**
 * SmartInvoice Africa — CSV Export Utility
 * Pure JS, no dependencies. Downloads a .csv file in the browser.
 */

/**
 * Convert an array of objects to a CSV string.
 * @param {Object[]} rows
 * @param {string[]} columns - keys to include, in order
 * @param {Object}   headers - { key: "Display Label" } map
 */
function toCsv(rows, columns, headers = {}) {
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // Wrap in quotes if it contains comma, newline, or quote
    if (s.includes(",") || s.includes("\n") || s.includes('"')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerRow = columns.map((k) => escape(headers[k] || k)).join(",");
  const dataRows = rows.map((row) =>
    columns.map((k) => escape(row[k])).join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Trigger a browser download of a CSV file.
 * @param {string} content  - CSV string
 * @param {string} filename - e.g. "invoices-overdue-2025-07-22.csv"
 */
function downloadCsv(content, filename) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export invoices to CSV.
 * @param {Object[]} invoices
 * @param {string}   filterLabel - label appended to filename (e.g. "overdue", "all")
 * @param {string}   sym         - currency symbol
 */
export function exportInvoicesCsv(invoices, filterLabel = "all", sym = "₦") {
  const date = new Date().toISOString().split("T")[0];
  const filename = `invoices-${filterLabel}-${date}.csv`;

  const rows = invoices.map((inv) => ({
    invoice_number: inv.invoice_number || inv.id,
    customer_name: inv.customer_name || inv.client,
    customer_email: inv.customer_email || inv.email || "",
    amount: inv.total || inv.amount || 0,
    status: inv.status,
    due_date: inv.due_date || inv.due || "",
    currency: inv.currency || "NGN",
    notes: inv.notes || "",
  }));

  const columns = ["invoice_number", "customer_name", "customer_email", "amount", "status", "due_date", "currency", "notes"];
  const headers = {
    invoice_number: "Invoice #",
    customer_name: "Customer",
    customer_email: "Email",
    amount: `Amount (${sym})`,
    status: "Status",
    due_date: "Due Date",
    currency: "Currency",
    notes: "Notes",
  };

  const csv = toCsv(rows, columns, headers);
  downloadCsv(csv, filename);
  return filename;
}

/**
 * Export expenses to CSV.
 */
export function exportExpensesCsv(expenses, filterLabel = "all", sym = "₦") {
  const date = new Date().toISOString().split("T")[0];
  const filename = `expenses-${filterLabel}-${date}.csv`;

  const rows = expenses.map((exp) => ({
    date: exp.expense_date || exp.date || "",
    vendor: exp.vendor,
    category: exp.category,
    amount: exp.amount || 0,
    currency: exp.currency || "NGN",
    notes: exp.notes || "",
  }));

  const columns = ["date", "vendor", "category", "amount", "currency", "notes"];
  const headers = {
    date: "Date",
    vendor: "Vendor",
    category: "Category",
    amount: `Amount (${sym})`,
    currency: "Currency",
    notes: "Notes",
  };

  const csv = toCsv(rows, columns, headers);
  downloadCsv(csv, filename);
  return filename;
}
