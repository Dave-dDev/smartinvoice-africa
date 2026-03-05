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
-- 6. AUTO-UPDATE TRIGGERS for updated_at
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
-- 7. AUTO-GENERATE INVOICE NUMBERS
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
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================

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

-- ============================================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists idx_customers_profile_id on customers(profile_id);
create index if not exists idx_invoices_profile_id on invoices(profile_id);
create index if not exists idx_invoices_customer_id on invoices(customer_id);
create index if not exists idx_invoice_items_invoice_id on invoice_items(invoice_id);
create index if not exists idx_expenses_profile_id on expenses(profile_id);

-- ============================================================================
-- 10. ENABLE REALTIME (for live updates)
-- ============================================================================
-- Go to Supabase Dashboard → Database → Replication
-- Toggle ON for: invoices, expenses, customers
-- This is done via the UI, not SQL

-- ============================================================================
-- DONE! Your database is ready.
-- ============================================================================
