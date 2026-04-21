// scripts/seed.js
// Run this script ONCE to seed initial production data.
// Requires SUPABASE_SERVICE_ROLE_KEY set in environment.
// DO NOT expose the service role key in client code.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('Seeding database...');

  // Optional: seed a sample customer (adjust profile_id to your user ID after signup)
  // const { data: { user } } = await supabase.auth.getUser(); // won't work with service key
  // Instead, use a known profile UUID or skip profile_id filtering for initial seed.

  const { error: customerError } = await supabase.from('customers').insert([
    {
      name: 'Sample Customer',
      contact_person: 'John Doe',
      email: 'customer@example.com',
      phone: '+234 800 000 0000',
      city: 'Lagos',
      country: 'Nigeria',
      address: '123 Example Street',
    }
  ]);
  if (customerError) {
    console.error('Failed to seed customers:', customerError);
  } else {
    console.log('✅ Seeded customers');
  }

  console.log('Seeding complete.');
}

seed().catch(console.error);
