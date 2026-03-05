# Supabase Backend Implementation Guide
## SmartInvoice Africa

---

## Overview

This guide walks you through replacing the mock data in SmartInvoice Africa with a fully functional Supabase backend — covering database schema design, authentication, real-time subscriptions, Row Level Security (RLS), and frontend integration.

**Stack additions:**
- Supabase (PostgreSQL database + Auth + Realtime + Storage)
- `@supabase/supabase-js` client SDK

---

## Step 1 — Create Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **New Project**.
3. Fill in:
   - **Name**: `smartinvoice-africa`
   - **Database Password**: generate a strong one and save it securely
   - **Region**: choose `af-south-1` (Cape Town) or the closest available to your users
4. Wait ~2 minutes for the project to provision.
5. From the project dashboard, go to **Project Settings → API** and copy:
   - `Project URL` → your `SUPABASE_URL`
   - `anon / public` key → your `SUPABASE_ANON_KEY`

---

## Step 2 — Install the Supabase Client

In your project root:

```bash
npm install @supabase/supabase-js
```

Create the environment file:

```bash
# .env (in project root — never commit this to git)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Add `.env` to your `.gitignore`:

```bash
echo ".env" >> .gitignore
```

Create the Supabase client singleton at `src/lib/supabase.js`:

```javascript
// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## Step 3 — Design the Database Schema

Go to your Supabase dashboard → **SQL Editor** and run the following schema in order.

### 3.1 — Enable UUID extension

```sql
create extension if not exists "uuid-ossp";
```

### 3.2 — Profiles table (links to Supabase Auth users)

```sql
create table profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  business_name  text        not null,
  owner_name     text,
  email          text        not null,
  phone          text,
  address        text,
  city           text,
  country        text        default 'Nigeria',
  currency       text        default 'NGN',
  vat_number     text,
  logo_url       text,
  plan           text        default 'free',  -- free | growth | enterprise
  created_at     timestamptz default now()
);
```

### 3.3 — Customers table

```sql
create table customers (
  id             uuid        default uuid_generate_v4() primary key,
  profile_id     uuid        references profiles(id) on delete cascade not null,
  name           text        not null,
  contact_person text,
  email          text,
  phone          text,
  city           text,
  country        text,
  address        text,
  total_invoiced numeric     default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
```

### 3.4 — Invoices table

```sql
create type invoice_status as enum ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled');

create table invoices (
  id             uuid           default uuid_generate_v4() primary key,
  invoice_number text           not null,                       -- e.g. INV-0047
  profile_id     uuid           references profiles(id) on delete cascade not null,
  customer_id    uuid           references customers(id) on delete set null,
  customer_name  text           not null,                       -- denormalised for speed
  customer_email text,
  subtotal       numeric        not null default 0,
  vat_rate       numeric        not null default 0,             -- e.g. 7.5
  vat_amount     numeric        not null default 0,
  total          numeric        not null default 0,
  currency       text           not null default 'NGN',
  status         invoice_status not null default 'draft',
  issue_date     date           not null default current_date,
  due_date       date,
  paid_at        timestamptz,
  notes          text,
  payment_method text,                                          -- bank | paystack | mobile_money | cash
  created_at     timestamptz    default now(),
  updated_at     timestamptz    default now()
);
```

### 3.5 — Invoice line items table

```sql
create table invoice_items (
  id           uuid    default uuid_generate_v4() primary key,
  invoice_id   uuid    references invoices(id) on delete cascade not null,
  description  text    not null,
  quantity     numeric not null default 1,
  unit_price   numeric not null default 0,
  total        numeric generated always as (quantity * unit_price) stored,
  created_at   timestamptz default now()
);
```

### 3.6 — Expenses table

```sql
create type expense_category as enum (
  'Inventory', 'Transport', 'Salaries', 'Utilities', 'Marketing', 'Rent', 'Other'
);

create table expenses (
  id           uuid             default uuid_generate_v4() primary key,
  profile_id   uuid             references profiles(id) on delete cascade not null,
  vendor       text             not null,
  category     expense_category not null default 'Other',
  amount       numeric          not null,
  currency     text             not null default 'NGN',
  expense_date date             not null default current_date,
  receipt_url  text,
  notes        text,
  created_at   timestamptz      default now(),
  updated_at   timestamptz      default now()
);
```

### 3.7 — Auto-update `updated_at` trigger

```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at();

create trigger trg_expenses_updated_at
  before update on expenses
  for each row execute function update_updated_at();

create trigger trg_customers_updated_at
  before update on customers
  for each row execute function update_updated_at();
```

### 3.8 — Auto-generate invoice numbers

```sql
create or replace function generate_invoice_number(p_profile_id uuid)
returns text as $$
declare
  next_num int;
begin
  select coalesce(max(
    cast(regexp_replace(invoice_number, '[^0-9]', '', 'g') as int)
  ), 0) + 1
  into next_num
  from invoices
  where profile_id = p_profile_id;

  return 'INV-' || lpad(next_num::text, 4, '0');
end;
$$ language plpgsql;
```

---

## Step 4 — Row Level Security (RLS)

RLS ensures every user can only see and modify their own data. Run these in SQL Editor.

```sql
-- Enable RLS on all tables
alter table profiles   enable row level security;
alter table customers  enable row level security;
alter table invoices   enable row level security;
alter table invoice_items enable row level security;
alter table expenses   enable row level security;

-- Profiles: users manage only their own profile
create policy "profiles: own row only"
  on profiles for all
  using (id = auth.uid());

-- Customers: belong to the authenticated user's profile
create policy "customers: own profile only"
  on customers for all
  using (profile_id = auth.uid());

-- Invoices: belong to the authenticated user's profile
create policy "invoices: own profile only"
  on invoices for all
  using (profile_id = auth.uid());

-- Invoice items: accessible via parent invoice ownership
create policy "invoice_items: own invoices only"
  on invoice_items for all
  using (
    invoice_id in (
      select id from invoices where profile_id = auth.uid()
    )
  );

-- Expenses: belong to the authenticated user's profile
create policy "expenses: own profile only"
  on expenses for all
  using (profile_id = auth.uid());
```

---

## Step 5 — Set Up Supabase Auth

### 5.1 — Enable email/password auth

In the Supabase dashboard go to **Authentication → Providers** and confirm **Email** is enabled.

### 5.2 — Create auth helper file

```javascript
// src/lib/auth.js
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
```

### 5.3 — Wire auth state into App.jsx

```javascript
// src/App.jsx — add at the top of your App component
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading…</div>;
  if (!user)   return <AuthPage />;    // show login/signup screen
  return <MainApp user={user} />;
}
```

---

## Step 6 — Create Data Service Layer

Create a services folder to keep all Supabase calls separate from your UI components.

### 6.1 — `src/services/invoiceService.js`

```javascript
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
```

### 6.2 — `src/services/expenseService.js`

```javascript
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
```

### 6.3 — `src/services/customerService.js`

```javascript
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
```

---

## Step 7 — Replace Mock Data with Live Data in Pages

For each page, swap the static `useState(MOCK_DATA)` with a `useEffect` that calls your service. The pattern is the same across all pages:

```javascript
// Example: Invoices.jsx
import { useState, useEffect } from "react";
import { fetchInvoices, createInvoice } from "../services/invoiceService";

export default function Invoices({ currency }) {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    fetchInvoices()
      .then(setInvoices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (formData) => {
    try {
      const newInvoice = await createInvoice(formData);
      setInvoices((prev) => [newInvoice, ...prev]);
    } catch (e) {
      console.error("Failed to create invoice:", e.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading invoices…</div>;
  if (error)   return <div style={{ padding: 40, color: "#C4522A" }}>Error: {error}</div>;

  // rest of your component JSX unchanged
}
```

Apply the same pattern to `Expenses.jsx`, `Customers.jsx`, and `Dashboard.jsx`.

---

## Step 8 — Enable Real-time Subscriptions

Supabase can push changes to your frontend automatically — great for knowing when a customer pays.

```javascript
// src/hooks/useRealtimeInvoices.js
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useRealtimeInvoices(setInvoices) {
  useEffect(() => {
    const channel = supabase
      .channel("invoices-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setInvoices((prev) => [payload.new, ...prev]);
          }
          if (payload.eventType === "UPDATE") {
            setInvoices((prev) =>
              prev.map((inv) => (inv.id === payload.new.id ? payload.new : inv))
            );
          }
          if (payload.eventType === "DELETE") {
            setInvoices((prev) => prev.filter((inv) => inv.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [setInvoices]);
}
```

Then in `Invoices.jsx`:

```javascript
import { useRealtimeInvoices } from "../hooks/useRealtimeInvoices";

// inside component:
useRealtimeInvoices(setInvoices);
// Now the invoice list auto-updates when a Paystack webhook marks an invoice as paid
```

Enable Realtime for your tables in Supabase dashboard → **Database → Replication** → toggle on `invoices`, `expenses`.

---

## Step 9 — Set Up Supabase Storage for Receipts

1. In the Supabase dashboard, go to **Storage → New Bucket**.
2. Name it `receipts`.
3. Set it to **Private** (access only via signed URLs).
4. Add a storage policy:

```sql
-- Allow authenticated users to upload their own receipts
create policy "receipts: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts');

-- Allow users to read their own receipt files
create policy "receipts: own files only"
  on storage.objects for select
  to authenticated
  using (auth.uid()::text = (storage.foldername(name))[1]);
```

The `uploadReceipt()` function in `expenseService.js` (Step 6.2) handles this automatically.

---

## Step 10 — Add a Webhook for Payment Auto-reconciliation

When Paystack or Flutterwave processes a payment, they send a webhook to your backend. Use a Supabase Edge Function to receive it and mark the invoice as paid automatically.

### 10.1 — Install Supabase CLI

```bash
npm install -g supabase
supabase login
supabase init
```

### 10.2 — Create the webhook Edge Function

```bash
supabase functions new payment-webhook
```

Edit `supabase/functions/payment-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const body = await req.json();

  // Verify Paystack signature (replace with your secret key check)
  // const sig = req.headers.get("x-paystack-signature");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!   // service role bypasses RLS
  );

  if (body.event === "charge.success") {
    const invoiceNumber = body.data?.metadata?.invoice_number;

    if (invoiceNumber) {
      await supabase
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString(), payment_method: "paystack" })
        .eq("invoice_number", invoiceNumber);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

### 10.3 — Deploy the Edge Function

```bash
supabase functions deploy payment-webhook --project-ref your-project-ref
```

The webhook URL will be:
```
https://your-project-ref.supabase.co/functions/v1/payment-webhook
```

Register this URL in your Paystack dashboard under **Settings → Webhooks**.

---

## Step 11 — Useful Database Views for Dashboard

Run these in SQL Editor to simplify dashboard queries:

```sql
-- Monthly revenue summary
create or replace view monthly_revenue as
select
  date_trunc('month', issue_date) as month,
  sum(total)                      as revenue,
  count(*)                        as invoice_count
from invoices
where status = 'paid'
group by 1
order by 1;

-- Outstanding receivables by customer
create or replace view receivables_by_customer as
select
  customer_name,
  sum(total)    as total_owed,
  count(*)      as invoice_count,
  min(due_date) as oldest_due
from invoices
where status in ('sent', 'viewed', 'overdue')
group by customer_name
order by total_owed desc;

-- Expense totals by category
create or replace view expenses_by_category as
select
  category,
  sum(amount) as total,
  count(*)    as entry_count
from expenses
group by category
order by total desc;
```

Query them from your frontend just like a table:

```javascript
const { data } = await supabase.from("monthly_revenue").select("*");
```

---

## Step 12 — Environment Variables for Production

When deploying (e.g. Vercel, Netlify), add these environment variables in your hosting dashboard:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your project URL from Supabase Settings |
| `VITE_SUPABASE_ANON_KEY` | Your anon/public key |

Never expose your `service_role` key to the frontend. It's only used server-side (Edge Functions).

---

## Final Folder Structure After Integration

```
smartinvoice-africa/
└── src/
    ├── lib/
    │   ├── supabase.js          ← Supabase client singleton
    │   └── auth.js              ← signUp, signIn, signOut helpers
    ├── services/
    │   ├── invoiceService.js    ← CRUD for invoices + line items
    │   ├── expenseService.js    ← CRUD for expenses + receipt upload
    │   └── customerService.js  ← CRUD for customers
    ├── hooks/
    │   └── useRealtimeInvoices.js ← Realtime subscription hook
    ├── data/
    │   └── mockData.js          ← Keep for fallback/dev only
    ├── components/ ...
    ├── pages/ ...
    └── App.jsx                  ← Wired with auth state
```

---

## Quick Reference — Key Supabase URLs

| Resource | URL |
|---|---|
| Dashboard | `https://app.supabase.com/project/your-ref` |
| SQL Editor | `Dashboard → SQL Editor` |
| Table Editor | `Dashboard → Table Editor` |
| Auth Users | `Dashboard → Authentication → Users` |
| Storage | `Dashboard → Storage` |
| Logs | `Dashboard → Logs → Postgres` |
| API Docs | `Dashboard → API → Docs` |
| Edge Functions | `Dashboard → Edge Functions` |

---

## Summary of Steps

| # | Step | What It Does |
|---|---|---|
| 1 | Create Supabase project | Provisions hosted Postgres + Auth + Storage |
| 2 | Install SDK + .env | Connects your React app to Supabase |
| 3 | Run SQL schema | Creates all 5 tables with correct types |
| 4 | Enable RLS policies | Locks each user to their own data |
| 5 | Set up Auth | Email/password login with auto-profile creation |
| 6 | Service layer | Centralised data functions, no SQL in components |
| 7 | Replace mock data | `useEffect` + service calls in each page |
| 8 | Realtime subscriptions | Invoice status updates push live to the UI |
| 9 | Storage for receipts | Secure file uploads for scanned receipts |
| 10 | Payment webhook | Auto-marks invoices paid when Paystack fires |
| 11 | DB views | Pre-built queries for dashboard aggregations |
| 12 | Production env vars | Secure key management for deployment |
