# Paystack Inline Checkout — Setup Guide

## ✅ What's Been Implemented

Customers can now pay invoices online with **Paystack's secure inline checkout popup** — cards, bank transfer, USSD, and mobile money — without leaving the app.

- **`Pay Now` button** on every unpaid invoice (opens the checkout popup)
- **Server-side transaction init** via a Supabase Edge Function (returns an `access_code`)
- **Webhook** that verifies the Paystack signature and marks the invoice `paid` automatically
- **Client-side fallback** — if the edge function isn't deployed, checkout still works (init done in the browser)
- **Idempotent reconciliation** — each payment is recorded once in `payment_transactions`, so webhooks can't double-mark invoices

---

## Step 1 — Create a Paystack Account

1. Go to [dashboard.paystack.com](https://dashboard.paystack.com) and sign up (free, no monthly fee).
2. Complete **Account Verification** (business details + bank account). You can start in **test mode** before that.

## Step 2 — Get Your API Keys

1. Dashboard → **Settings → API Keys & Webhooks**
2. Copy:
   - **Public key** — starts with `pk_test_...` (test) or `pk_live_...` (live)
   - **Secret key** — starts with `sk_test_...` or `sk_live_...`

## Step 3 — Frontend: Add Keys to `.env`

Create/update your `.env` (never commit it):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...

# Paystack
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ Only the **public** key goes in the client. The secret key lives exclusively in the edge function secrets (Step 5). A copy of `.env.example` is already updated.

## Step 4 — Database: Add the `payment_transactions` Table

The `payment_transactions` table is **not** yet in your Supabase database. Run this in **Supabase Dashboard → SQL Editor**:

```sql
create extension if not exists "uuid-ossp";

create table if not exists payment_transactions (
  id              uuid         default uuid_generate_v4() primary key,
  reference       text         not null unique,
  invoice_number  text         not null,
  amount          numeric      not null,
  currency        text         not null default 'NGN',
  status          text         not null default 'pending', -- pending | paid | failed
  provider        text         not null default 'paystack',
  paid_at         timestamptz,
  created_at      timestamptz  default now()
);

alter table payment_transactions enable row level security;

create policy "payment_transactions: authenticated read"
  on payment_transactions for select
  using (auth.role() = 'authenticated');

create index if not exists idx_payment_tx_reference on payment_transactions(reference);
```

(This is section 6 of `SUPABASE_SCHEMA.sql` — you can run the whole file if you haven't already.)

## Step 5 — Deploy the Edge Functions

Install the Supabase CLI (once):

```bash
npm install -g supabase
supabase login
```

Link and deploy:

```bash
supabase init
supabase link --project-ref your-project-ref

supabase functions deploy paystack-init
supabase functions deploy payment-webhook
```

Set the secret keys in **Supabase Dashboard → Edge Functions → Secrets** (or with the CLI):

```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> The `paystack-init` function also supports an optional `PAYSTACK_CALLBACK_URL` secret (e.g. your app URL) where customers return after paying.

## Step 6 — Register the Webhook in Paystack

1. Paystack Dashboard → **Settings → API Keys & Webhooks → Webhooks**
2. Add the webhook URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/payment-webhook
   ```
3. Event type: `charge.success` (select **All** is fine too).

Now when a customer pays, Paystack calls the webhook, the signature is verified, and the invoice flips to **Paid** automatically — no manual entry.

---

## 🧪 Testing in Test Mode

1. Keep `pk_test_...` / `sk_test_...` keys in place.
2. Create an invoice with a **customer email** (Paystack requires it for the popup).
3. Open the invoice → **💳 Pay Now**.
4. In the popup use Paystack's test card: `4084 0840 8408 4081`, any future expiry, any CVV. You can also force a failure with `4084 0840 8408 4082`.
5. On success the popup closes and the invoice shows **Paid**.
6. Check `payment_transactions` in Supabase Table Editor to confirm the row recorded `status = paid`.

## 🚀 Going Live

1. Finish **Account Verification** in Paystack (CAC registration for companies + bank account).
2. Switch `.env` to `pk_live_...` and the edge function secret to `sk_live_...`.
3. Redeploy the functions after changing the secret.
4. Do a small real payment (e.g. ₦1,000) to confirm end-to-end.

> Fees: ~1.5% + ₦100 per successful local card charge, ~3.5% for international cards. No setup or monthly fees.

---

## 🐛 Troubleshooting

### "Paystack isn't configured yet"
Add `VITE_PAYSTACK_PUBLIC_KEY` to `.env` and restart `npm run dev`.

### "A customer email is required"
Add a customer email to the invoice (the email field in Create/Edit Invoice).

### Popup opens but the invoice isn't marked paid
- Confirm the webhook URL is registered in Paystack and uses `/functions/v1/payment-webhook`.
- Check Paystack Dashboard → **Webhooks → Logs** for delivery failures.
- Confirm `PAYSTACK_SECRET_KEY` matches the dashboard and the function was redeployed.
- The client also marks it paid optimistically on `onSuccess`, so check the `payment_transactions` row first.

### Invoice marked paid but `payment_transactions` shows pending
The webhook hasn't fired (see above) — the client-side `onSuccess` only updates the invoice row, not the transaction row.

### Reference already exists error
Each click generates a fresh reference (`INV-<number>-<timestamp>`), so duplicates are normal if the popup is reopened. The unique constraint just prevents double-processing.

---

## 📚 Files Added/Modified

### Created
- `src/lib/paystack.js` — client helper (script loader, server-side init with fallback, popup)
- `supabase/functions/paystack-init/index.ts` — returns `access_code`
- `supabase/functions/payment-webhook/index.ts` — verifies + marks invoice paid
- `PAYSTACK_SETUP.md` — this guide

### Modified
- `src/pages/Invoices.jsx` — "💳 Pay Now" button + payment state in the invoice modal
- `.env.example` — added `VITE_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`
- `SUPABASE_SCHEMA.sql` — added `payment_transactions` table, RLS, index

---

**Need help?** Check the browser console for `paystack-init unavailable…` warnings (means the fallback is active) or the Paystack webhook logs for delivery errors.
