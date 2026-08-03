import { supabase } from "../lib/supabase";
import {
  DEFAULT_CHART_OF_ACCOUNTS,
  invoiceIssueEntry,
  invoicePaymentEntry,
  expenseEntry,
} from "../lib/ledger";

export async function fetchChartOfAccounts() {
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("*")
    .order("code", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Seed the default chart of accounts for a profile (no-op if already seeded).
 */
export async function ensureDefaultChart(profileId) {
  const { count, error } = await supabase
    .from("chart_of_accounts")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId);

  if (error) throw error;
  if (count && count > 0) return;

  const rows = DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
    profile_id: profileId,
    ...a,
    is_system: true,
  }));

  const { error: insertError } = await supabase
    .from("chart_of_accounts")
    .insert(rows);

  if (insertError) throw insertError;
}

async function accountIdByCode(profileId, code) {
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("profile_id", profileId)
    .eq("code", code)
    .single();

  if (error) throw error;
  return data.id;
}

async function deleteEntriesForSource(profileId, sourceType, sourceId) {
  const { data: existing, error: findError } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("profile_id", profileId)
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);

  if (findError) throw findError;

  const ids = (existing || []).map((e) => e.id);
  if (ids.length === 0) return;

  await supabase.from("journal_lines").delete().in("journal_entry_id", ids);
  await supabase.from("journal_entries").delete().in("id", ids);
}

async function postEntry(profileId, entry) {
  const { data: header, error: headerError } = await supabase
    .from("journal_entries")
    .insert({
      profile_id: profileId,
      entry_date: entry.date || new Date().toISOString().slice(0, 10),
      source_type: entry.sourceType,
      source_id: entry.sourceId,
      description: entry.description,
      reference: entry.reference || null,
    })
    .select()
    .single();

  if (headerError) throw headerError;

  const lines = [];
  for (const line of entry.lines) {
    const account_id = await accountIdByCode(profileId, line.accountCode);
    lines.push({
      journal_entry_id: header.id,
      account_id,
      debit: line.debit || 0,
      credit: line.credit || 0,
    });
  }

  if (lines.length) {
    const { error: linesError } = await supabase.from("journal_lines").insert(lines);
    if (linesError) throw linesError;
  }

  return header;
}

/**
 * Idempotently post both the "issued" and (if paid) "payment" entries for an invoice.
 */
export async function postInvoiceEntries(profileId, invoice) {
  const invoiceId = String(invoice.id ?? "");
  await deleteEntriesForSource(profileId, "invoice", invoiceId);

  const status = (invoice.status ?? "").toLowerCase();
  const entries = [];
  if (["sent", "viewed", "overdue", "paid"].includes(status)) {
    entries.push(invoiceIssueEntry(invoice));
  }
  if (status === "paid") {
    entries.push(invoicePaymentEntry(invoice));
  }

  const posted = [];
  for (const entry of entries) {
    posted.push(await postEntry(profileId, entry));
  }
  return posted;
}

/**
 * Idempotently post the entry for an expense.
 */
export async function postExpenseEntry(profileId, expense) {
  const expenseId = String(expense.id ?? "");
  await deleteEntriesForSource(profileId, "expense", expenseId);
  return postEntry(profileId, expenseEntry(expense));
}

export async function fetchJournalEntries() {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*, journal_lines(*, chart_of_accounts(id, code, name, account_type))")
    .order("entry_date", { ascending: false });

  if (error) throw error;
  return data || [];
}
