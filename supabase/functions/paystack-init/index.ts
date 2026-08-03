// SmartInvoice Africa — Paystack transaction initialization
// Server-side call to Paystack's Initialize API, returning an access_code
// that the frontend uses to open the inline checkout popup.
//
// Env vars required (Supabase → Edge Functions → Secrets):
//   PAYSTACK_SECRET_KEY   e.g. sk_test_...
//   PAYSTACK_CALLBACK_URL (optional) URL customers return to after paying

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_BASE = "https://api.paystack.co";
const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!SECRET) {
      return json({ error: "PAYSTACK_SECRET_KEY is not configured" }, 500, cors);
    }

    const body = await req.json();
    const { email, amount, currency = "NGN", invoice_number, customer_name } = body;

    if (!email || !amount || !invoice_number) {
      return json(
        { error: "email, amount and invoice_number are required" },
        400,
        cors
      );
    }

    const reference = `INV-${invoice_number}-${Date.now()}`;

    // Create a unique reference in the DB so the webhook can reconcile safely.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    const { error: txError } = await supabase.from("payment_transactions").insert({
      reference,
      invoice_number,
      amount,
      currency,
      status: "pending",
    });
    if (txError) console.warn("payment_transactions insert:", txError.message);

    // Ask Paystack to initialize the transaction.
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Paystack expects kobo/cents
        currency,
        reference,
        metadata: { invoice_number, customer_name, custom_fields: [] },
        callback_url: Deno.env.get("PAYSTACK_CALLBACK_URL") || "",
      }),
    });

    const data = await res.json();
    if (!data.status) {
      console.error("Paystack initialize error:", data.message);
      return json({ error: data.message || "Paystack initialization failed" }, 502, cors);
    }

    return json({
      access_code: data.data.access_code,
      authorization_url: data.data.authorization_url,
      reference,
    }, 200, cors);
  } catch (err) {
    console.error("paystack-init error:", err.message);
    return json({ error: "Internal error" }, 500, cors);
  }
});

function json(payload, status, headers) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
