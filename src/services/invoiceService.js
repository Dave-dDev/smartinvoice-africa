import { supabase } from "../lib/supabase";

export async function fetchInvoices() {
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      invoice_items (*),
      customers (name, email, phone)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createInvoice({ customerName, customerEmail, customerId, dueDate, items, vatRate, notes, currency }) {
  const { data: { user } } = await supabase.auth.getUser();

  const subtotal  = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const vatAmount = subtotal * (vatRate / 100);
  const total     = subtotal + vatAmount;

  // Generate invoice number via DB function
  const { data: numData } = await supabase
    .rpc("generate_invoice_number", { p_profile_id: user.id });

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      profile_id:    user.id,
      invoice_number: numData,
      customer_id:   customerId ?? null,
      customer_name: customerName,
      customer_email: customerEmail,
      subtotal,
      vat_rate:     vatRate,
      vat_amount:   vatAmount,
      total,
      currency,
      due_date:     dueDate,
      notes,
      status:       "sent",
    })
    .select()
    .single();

  if (error) throw error;

  // Insert line items
  const lineItems = items.map((item) => ({
    invoice_id:  invoice.id,
    description: item.description,
    quantity:    item.quantity,
    unit_price:  item.unit_price,
  }));

  const { error: itemsError } = await supabase.from("invoice_items").insert(lineItems);
  if (itemsError) throw itemsError;

  return invoice;
}

export async function updateInvoiceStatus(invoiceId, status) {
  const { data, error } = await supabase
    .from("invoices")
    .update({ status, ...(status === "paid" ? { paid_at: new Date().toISOString() } : {}) })
    .eq("id", invoiceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInvoice(invoiceId) {
  const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
  if (error) throw error;
}
