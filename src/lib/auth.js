import { supabase } from "./supabase";

export async function signUp({ email, password, businessName, ownerName }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // Create profile row immediately after signup
  const { error: profileError } = await supabase.from("profiles").insert({
    id:            data.user.id,
    email,
    business_name: businessName,
    owner_name:    ownerName,
  });
  if (profileError) throw profileError;

  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}
