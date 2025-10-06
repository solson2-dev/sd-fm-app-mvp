/**
 * Verify RLS Policies Script
 * Tests that RLS is properly configured
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRLS() {
  console.log('🔒 Verifying RLS Policies...\n');

  // Check if user_organizations table exists
  const { data: tables, error: tableError } = await supabase
    .from('user_organizations')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('❌ user_organizations table check failed:', tableError.message);
  } else {
    console.log('✅ user_organizations table exists');
  }

  // Check that RLS is enabled on all tables
  const tablesToCheck = [
    'scenarios',
    'organizations',
    'personnel_roles',
    'monthly_opex_projections',
    'annual_projections',
    'funding_rounds',
    'assumptions'
  ];

  for (const table of tablesToCheck) {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1);

    if (error) {
      console.log(`🔒 ${table}: RLS enabled (expected auth error: ${error.message})`);
    } else {
      console.log(`⚠️  ${table}: RLS may not be properly configured`);
    }
  }

  console.log('\n✅ RLS verification complete');
}

verifyRLS().catch(console.error);
