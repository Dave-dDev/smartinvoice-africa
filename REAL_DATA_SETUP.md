# Switch to Real Supabase Data — Quick Start

This guide walks you through moving from mock data to real Supabase-backed data.

## 1) Create a Supabase Project

1. Go to https://supabase.com and create a new project.
2. Wait for the project to finish provisioning.
3. Go to **Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, do NOT expose in client)

## 2) Apply the Database Schema

1. Open **SQL Editor** in your Supabase dashboard.
2. Copy the contents of `SUPABASE_SCHEMA.sql` from this repo.
3. Paste into the SQL Editor and **Run**.
4. (Optional) Run `rls-policies.sql` for explicit policy names.

## 3) Configure Authentication

1. Go to **Authentication → Settings**.
2. Under **Site URL**, set your production URL (e.g., `https://your-domain.com`).
3. Under **Allowed Origins (CORS)**, add:
   - `http://localhost:5173` (dev)
   - `http://localhost:4173` (preview)
   - Your production URL
4. Under **Email Auth**, enable **Confirm email** if you want email confirmation.
5. Configure SMTP if needed (Supabase provides default emails; custom SMTP is optional).

## 4) Set Environment Variables Locally

Create or update `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

For seeding only (server-side), also set:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 5) Seed Initial Data (Optional)

From the project root:

```powershell
node scripts/seed.js
```

This inserts sample customers. Adjust `scripts/seed.js` as needed.

## 6) Enable Realtime (Optional, for live updates)

1. Go to **Database → Replication**.
2. Toggle **ON** for `invoices`, `expenses`, `customers`.

## 7) Run the App Locally

```powershell
npm install          # if you haven't already
npm run dev          # start Vite dev server
```

Open the printed `http://localhost:5173` link, sign up, and start creating real data.

## 8) Deploy and Set Env Vars

- **Vercel**: Project Settings → Environment Variables → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Netlify**: Site Settings → Environment Variables.
- **GitHub Pages**: Use GitHub Actions secrets and inject via workflow (see `GITHUB_DEPLOYMENT.md`).

## 9) Verify RLS

Test that users can only see their own data:

- Sign up as User A → create invoices.
- Sign up as User B → confirm User A's invoices are not visible.

If you see permission errors, ensure:

- RLS is enabled on tables.
- Policies reference `profile_id = auth.uid()` correctly.

## Troubleshooting

- **"Failed to fetch" on signup**: Check CORS allowed origins and that you're serving over HTTP (not `file://`).
- **RLS errors**: Confirm `profile_id` is set to `auth.uid()` on inserts.
- **Missing tables**: Re-run `SUPABASE_SCHEMA.sql`.

---

You're ready to go! 🚀
