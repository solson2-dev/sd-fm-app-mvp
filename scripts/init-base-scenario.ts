import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function initBaseScenario() {
  console.log('Creating base scenario...');

  // Create scenario with service role (bypasses RLS)
  const { data: scenario, error: scenarioError } = await supabase
    .from('scenarios')
    .upsert({
      id: 'b0000000-0000-0000-0000-000000000001',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Base Case',
      description: 'Default scenario for MVP',
      created_by: '30099033-b36b-4f7f-aaa8-6dc26b98f799',
    })
    .select()
    .single();

  if (scenarioError) {
    console.error('Error creating scenario:', scenarioError);
    process.exit(1);
  }

  console.log('✓ Base scenario created:', scenario.name);
  console.log('  ID:', scenario.id);
}

initBaseScenario().catch(console.error);
