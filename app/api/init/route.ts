import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * Initialize default organization and scenario for MVP
 * This is a temporary endpoint for MVP testing
 */
export async function POST() {
  try {
    const orgId = 'a0000000-0000-0000-0000-000000000001';
    const scenarioId = 'b0000000-0000-0000-0000-000000000001';

    // Check if scenario already exists
    const { data: existingScenario } = await supabase
      .from('scenarios')
      .select('id')
      .eq('id', scenarioId)
      .single();

    if (existingScenario) {
      return NextResponse.json({
        success: true,
        message: 'Scenario already exists',
        scenarioId,
      });
    }

    // Try to create organization (may fail if schema requires owner_id)
    await supabase.from('organizations').upsert(
      {
        id: orgId,
        name: 'StudioDatum',
        slug: 'studiodatum',
      },
      { onConflict: 'id' }
    );

    // Try to create scenario
    const { error: scenarioError } = await supabase.from('scenarios').upsert(
      {
        id: scenarioId,
        organization_id: orgId,
        name: 'Base Case',
        type: 'base',
        description: 'MVP test scenario with validated calculations',
      },
      { onConflict: 'id' }
    );

    if (scenarioError) {
      return NextResponse.json(
        {
          success: false,
          error: scenarioError.message,
          hint: 'The database schema may require additional fields (owner_id, created_by). Please use the admin SQL console to create the scenario manually.',
          sql: `
-- Run this in Supabase SQL Editor:

-- Create default organization (skip if using full schema with auth)
INSERT INTO organizations (id, name, slug, created_at, updated_at)
VALUES (
  '${orgId}'::uuid,
  'StudioDatum',
  'studiodatum',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Create default scenario
INSERT INTO scenarios (id, organization_id, name, type, description, created_at, updated_at)
VALUES (
  '${scenarioId}'::uuid,
  '${orgId}'::uuid,
  'Base Case',
  'base',
  'MVP test scenario with validated calculations',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
          `,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Default organization and scenario created',
      orgId,
      scenarioId,
    });
  } catch (error) {
    console.error('Error initializing:', error);
    return NextResponse.json(
      { error: 'Failed to initialize default data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const scenarioId = 'b0000000-0000-0000-0000-000000000001';

  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single();

  if (error || !data) {
    return NextResponse.json({
      exists: false,
      message: 'Default scenario not found. Run POST /api/init to create it.',
    });
  }

  return NextResponse.json({
    exists: true,
    scenario: data,
  });
}
