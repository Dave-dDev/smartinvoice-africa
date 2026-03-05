# SmartInvoice Africa - Complete Setup Guide

## ✅ Status: You're Almost There!

Your application has:
- ✅ Supabase credentials configured
- ✅ Database schema ready to deploy
- ✅ Frontend pages connected to services
- ✅ Authentication system ready
- ✅ Real-time hooks configured
- ⏳ Pending: Database schema deployment & configuration

---

## Quick Start - 5 Steps to Launch

### Step 1: Run the SQL Schema

1. Go to your **Supabase Dashboard**: https://app.supabase.com
2. Click your project
3. Go to **SQL Editor** → **New Query**
4. Copy the entire contents of `SUPABASE_SCHEMA.sql` 
5. Paste into the query editor and click **RUN**

This creates all tables, functions, and security policies.

### Step 2: Enable Authentication

1. In Supabase Dashboard, go to **Authentication → Providers**
2. Confirm **Email** provider is enabled
3. Check **"Confirm email"** is turned ON

### Step 3: Enable Real-time

1. Go to **Database → Replication** (in Supabase sidebar)
2. Under "Replication" toggle ON for:
   - `invoices`
   - `expenses` 
   - `customers`
3. Click **Save**

### Step 4: Create a Storage Bucket (Optional, for receipts)

1. Go to **Storage → New Bucket**
2. Name: `receipts`
3. Set to **Private**
4. Click **Create bucket**

### Step 5: Test the App

1. Start the dev server: `npm run dev`
2. Visit http://localhost:5175
3. Click **"Don't have an account? Sign up"**
4. Enter test credentials:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Business Name: `Test Business`
   - Owner Name: `Your Name`
5. Create account → You should be logged in!

---

## Testing the Features

### Test Invoices:
1. Click **Invoices** in sidebar
2. Click **"+ New Invoice"**
3. Fill in customer name and add line items
4. Click **"Create & Send Invoice"**
5. Invoice appears in list automatically (real-time!)

### Test Customers:
1. Click **Customers** in sidebar
2. Click **"+ Add Customer"**
3. Enter customer details
4. New customer appears in grid

### Test Expenses:
1. Click **Expenses** in sidebar
2. Click **"+ Add Expense"**
3. Fill in vendor, category, amount
4. New expense appears in table

---

## Troubleshooting

### Issue: "Cannot read property of undefined"
**Solution:** Make sure you ran the SQL schema and created the `profiles` table.

### Issue: "Auth session not found"
**Solution:** Sign up creates your profile automatically. If error persists, check your Supabase credentials in `.env`

### Issue: Data not appearing after creation
**Solution:** 
- Check browser console for errors (F12)
- Verify Row Level Security policies are enabled
- Confirm you're running the latest version of the app

### Issue: Real-time updates not working
**Solution:** 
1. Go to Supabase → Database → Replication
2. Toggle ON for the tables you want to sync
3. Refresh the browser

---

## Environment Variables Reference

Your `.env` file currently has:
```
VITE_SUPABASE_URL=https://snpiyqkncmtoqrrrmfht.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_k9YhtRHzWNqHS6JSU8is4g_tu07TVWt
```

These are your public anon keys (safe to share). Never expose your `service_role_key`.

---

## File Structure for Reference

```
smartinvoice-africa/
├── src/
│   ├── lib/
│   │   ├── supabase.js       ← Supabase client
│   │   └── auth.js           ← Auth functions
│   ├── services/
│   │   ├── invoiceService.js
│   │   ├── expenseService.js
│   │   └── customerService.js
│   ├── hooks/
│   │   └── useRealtimeInvoices.js
│   ├── pages/
│   │   ├── App.jsx
│   │   ├── Invoices.jsx
│   │   ├── Expenses.jsx
│   │   └── Customers.jsx
│   └── components/
├── .env                      ← Your Supabase credentials
└── SUPABASE_SCHEMA.sql       ← Database schema to run
```

---

## What Happens When You Sign Up?

1. Email & password sent to Supabase Auth
2. Account created in `auth.users` table
3. User profile auto-created in `profiles` table
4. RLS policies activate → user can only see their own data
5. You're logged in and ready to use the app!

---

## Next Steps (Advanced)

- **Payments:** Integrate Paystack webhook to auto-mark invoices paid
- **Storage:** Upload receipt files to the `receipts` bucket
- **Branding:** Add custom logo and business photo
- **Reports:** Query the database views for analytics
- **Deploy:** Host on Vercel/Netlify with Supabase

---

## Need Help?

- Supabase Docs: https://supabase.com/docs
- SmartInvoice Guide: See `supabase-integration-guide.md` in project root

**You're all set! Run the schema and start testing.** 🚀
