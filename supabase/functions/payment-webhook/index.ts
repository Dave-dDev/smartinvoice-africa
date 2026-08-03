// SmartInvoice Africa — Paystack webhook
// Receives charge.success events and marks the matching invoice as paid.
//
// 1. Set PAYSTACK_SECRET_KEY in Supabase Edge Function secrets.
// 2. Deploy: supabase functions deploy payment-webhook
// 3. Register the function URL in Paystack dashboard → Settings → Webhooks:
//    https://<project-ref>.supabase.co/functions/v1/payment-webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.224.0/crypto/hmac.ts";

const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

serve(async (req) => {
  const bodyText = await req.text();

  // ── Verify the signature so only genuine Paystack events are trusted ──
  const signature = req.headers.get("x-paystack-signature");
  if (!SECRET || !signature) {
    return new Response("missing signature", { status: 401 });
  }

  const expected = createHmac("sha512", SECRET).update(bodyText).hex();
  if (signature !== expected) {
    return new Response("invalid signature", { status: 401 });
  }

  const body = JSON.parse(bodyText);

  if (body.event !== "charge.success") {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const reference = body.data?.reference;
  const invoiceNumber = body.data?.metadata?.invoice_number;
  if (!invoiceNumber) {
    return new Response(JSON.stringify({ received: true, skipped: "no invoice_number" }), { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  // Only mark paid once per transaction reference.
  const { data: existing } = await supabase
    .from("payment_transactions")
    .select("status")
    .eq("reference", reference)
    .single();

  if (existing?.status === "paid") {
    return new Response(JSON.stringify({ received: true, skipped: "already paid" }), { status: 200 });
  }

  await supabase
    .from("payment_transactions")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("reference", reference);

  await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: "paystack",
    })
    .eq("invoice_number", invoiceNumber);

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
