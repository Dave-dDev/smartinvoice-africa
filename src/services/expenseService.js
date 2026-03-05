import { supabase } from "../lib/supabase";

export async function fetchExpenses() {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createExpense({ vendor, category, amount, currency, date, notes }) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      profile_id:   user.id,
      vendor,
      category,
      amount,
      currency,
      expense_date: date,
      notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadReceipt(file, expenseId) {
  const ext      = file.name.split(".").pop();
  const filePath = `receipts/${expenseId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("receipts")
    .getPublicUrl(filePath);

  await supabase.from("expenses").update({ receipt_url: publicUrl }).eq("id", expenseId);
  return publicUrl;
}
