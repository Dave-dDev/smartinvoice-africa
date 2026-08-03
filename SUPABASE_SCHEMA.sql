-- ============================================================================
-- SmartInvoice Africa - Complete Database Schema
-- Run this SQL in Supabase → SQL Editor
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE (links to Supabase Auth users)
-- ============================================================================
create table if not exists profiles (
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
  plan           text        default 'free',
  created_at     timestamptz default now()
);

-- ============================================================================
-- 2. CUSTOMERS TABLE
-- ============================================================================
create table if not exists customers (
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

-- ============================================================================
-- 3. INVOICES TABLE & STATUS ENUM
-- ============================================================================
create type invoice_status as enum ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled');

create table if not exists invoices (
  id             uuid           default uuid_generate_v4() primary key,
  invoice_number text           not null,
  profile_id     uuid           references profiles(id) on delete cascade not null,
  customer_id    uuid           references customers(id) on delete set null,
  customer_name  text           not null,
  customer_email text,
  subtotal       numeric        not null default 0,
  vat_rate       numeric        not null default 0,
  vat_amount     numeric        not null default 0,
  total          numeric        not null default 0,
  currency       text           not null default 'NGN',
  status         invoice_status not null default 'draft',
  issue_date     date           not null default current_date,
  due_date       date,
  paid_at        timestamptz,
  notes          text,
  payment_method text,
  created_at     timestamptz    default now(),
  updated_at     timestamptz    default now()
);

-- ============================================================================
-- 4. INVOICE LINE ITEMS
-- ============================================================================
create table if not exists invoice_items (
  id           uuid    default uuid_generate_v4() primary key,
  invoice_id   uuid    references invoices(id) on delete cascade not null,
  description  text    not null,
  quantity     numeric not null default 1,
  unit_price   numeric not null default 0,
  total        numeric generated always as (quantity * unit_price) stored,
  created_at   timestamptz default now()
);

-- ============================================================================
-- 5. EXPENSES TABLE & CATEGORY ENUM
-- ============================================================================
create type expense_category as enum (
  'Inventory', 'Transport', 'Salaries', 'Utilities', 'Marketing', 'Rent', 'Other'
);

create table if not exists expenses (
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

-- ============================================================================
-- 6. PAYMENT TRANSACTIONS (Paystack reconciliation)
-- ============================================================================
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

-- ============================================================================
-- 7. ACCOUNTING CORE — Double-Entry General Ledger
-- ============================================================================
-- Chart of Accounts
create table if not exists chart_of_accounts (
  id           uuid        default uuid_generate_v4() primary key,
  profile_id   uuid        references profiles(id) on delete cascade not null,
  code         text        not null,                 -- e.g. '1200'
  name         text        not null,                 -- e.g. 'Accounts Receivable'
  account_type text        not null                  -- asset | liability | equity | income | expense
    check (account_type in ('asset','liability','equity','income','expense')),
  category     text        default 'Operating',      -- Operating | Tax | Other
  is_system    boolean     default false,            -- seeded by the app, not user-editable
  created_at   timestamptz default now(),
  unique (profile_id, code)
);

-- Journal Entries (the header of each double-entry transaction)
create table if not exists journal_entries (
  id          uuid         default uuid_generate_v4() primary key,
  profile_id  uuid         references profiles(id) on delete cascade not null,
  entry_date  date         not null default current_date,
  source_type text         not null,                 -- invoice | payment | expense | journal
  source_id   text,
  description text,
  reference   text,
  created_at  timestamptz  default now()
);

-- Journal Lines (the debits and credits — must balance to zero per entry)
create table if not exists journal_lines (
  id               uuid    default uuid_generate_v4() primary key,
  journal_entry_id uuid    references journal_entries(id) on delete cascade not null,
  account_id       uuid    references chart_of_accounts(id) on delete restrict not null,
  debit            numeric not null default 0,
  credit           numeric not null default 0
);

-- ============================================================================
-- 8. AUTO-UPDATE TRIGGERS for updated_at
-- ============================================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger if not exists trg_invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at();

create trigger if not exists trg_expenses_updated_at
  before update on expenses
  for each row execute function update_updated_at();

create trigger if not exists trg_customers_updated_at
  before update on customers
  for each row execute function update_updated_at();

-- ============================================================================
-- 9. AUTO-GENERATE INVOICE NUMBERS
-- ============================================================================
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

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table profiles   enable row level security;
alter table customers  enable row level security;
alter table invoices   enable row level security;
alter table invoice_items enable row level security;
alter table expenses   enable row level security;
alter table payment_transactions enable row level security;
alter table chart_of_accounts enable row level security;
alter table journal_entries enable row level security;
alter table journal_lines enable row level security;

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

-- Payment transactions: visible to all authenticated users (reconciled by webhook)
create policy "payment_transactions: authenticated read"
  on payment_transactions for select
  using (auth.role() = 'authenticated');

-- Chart of Accounts: belong to the authenticated user's profile
create policy "chart_of_accounts: own profile only"
  on chart_of_accounts for all
  using (profile_id = auth.uid());

-- Journal Entries: belong to the authenticated user's profile
create policy "journal_entries: own profile only"
  on journal_entries for all
  using (profile_id = auth.uid());

-- Journal Lines: accessible via parent journal entry ownership
create policy "journal_lines: own entries only"
  on journal_lines for all
  using (
    journal_entry_id in (
      select id from journal_entries where profile_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists idx_customers_profile_id on customers(profile_id);
create index if not exists idx_invoices_profile_id on invoices(profile_id);
create index if not exists idx_invoices_customer_id on invoices(customer_id);
create index if not exists idx_invoice_items_invoice_id on invoice_items(invoice_id);
create index if not exists idx_expenses_profile_id on expenses(profile_id);
create index if not exists idx_payment_tx_reference on payment_transactions(reference);
create index if not exists idx_journal_entries_profile on journal_entries(profile_id);
create index if not exists idx_journal_lines_entry on journal_lines(journal_entry_id);
create index if not exists idx_chart_of_accounts_profile on chart_of_accounts(profile_id);

-- ============================================================================
-- 11. ENABLE REALTIME (for live updates)
-- ============================================================================
-- Go to Supabase Dashboard → Database → Replication
-- Toggle ON for: invoices, expenses, customers
-- This is done via the UI, not SQL

-- ============================================================================
-- DONE! Your database is ready.
-- ============================================================================
