import { supabase } from "../lib/supabase";

export async function fetchCustomers() {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function createCustomer({ name, contactPerson, email, phone, city, country }) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("customers")
    .insert({
      profile_id:     user.id,
      name,
      contact_person: contactPerson,
      email,
      phone,
      city,
      country,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
