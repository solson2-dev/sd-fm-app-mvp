import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { AssumptionRow, GroupedAssumptions } from '@/lib/types/database';

/**
 * GET /api/assumptions?scenarioId=xxx
 * Fetches all assumptions/variables for a scenario
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenarioId = searchParams.get('scenarioId');

  if (!scenarioId) {
    return NextResponse.json(
      { error: 'scenarioId is required' },
      { status: 400 }
    );
  }

  try {
    const { data: assumptions, error } = await supabase
      .from('assumptions')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('key');

    if (error) throw error;

    // Group assumptions by category for easier display
    const grouped = (assumptions || []).reduce((acc: GroupedAssumptions, assumption: AssumptionRow) => {
      const category = assumption.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(assumption);
      return acc;
    }, {} as GroupedAssumptions);

    return NextResponse.json({
      assumptions: assumptions || [],
      grouped
    });
  } catch (error) {
    console.error('Error fetching assumptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assumptions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assumptions
 * Creates or updates an assumption
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, key, value, category, description } = body;

    if (!scenarioId || !key || value === undefined) {
      return NextResponse.json(
        { error: 'scenarioId, key, and value are required' },
        { status: 400 }
      );
    }

    // Get organization_id from scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('organization_id')
      .eq('id', scenarioId)
      .single();

    if (scenarioError || !scenario) {
      throw new Error('Scenario not found');
    }

    // Use upsert to handle both create and update
    const { data, error } = await supabase
      .from('assumptions')
      .upsert({
        organization_id: scenario.organization_id,
        scenario_id: scenarioId,
        key,
        value: value.toString(),
        category: category || 'general',
        description: description || null,
      }, {
        onConflict: 'scenario_id,key',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ assumption: data });
  } catch (error) {
    console.error('Error saving assumption:', error);
    return NextResponse.json(
      { error: 'Failed to save assumption' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/assumptions
 * Bulk update multiple assumptions
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, assumptions } = body;

    if (!scenarioId || !assumptions || !Array.isArray(assumptions)) {
      return NextResponse.json(
        { error: 'scenarioId and assumptions array are required' },
        { status: 400 }
      );
    }

    // Get organization_id from scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('organization_id')
      .eq('id', scenarioId)
      .single();

    if (scenarioError || !scenario) {
      throw new Error('Scenario not found');
    }

    // Prepare records for upsert
    const records = assumptions.map((a: Partial<AssumptionRow>) => ({
      organization_id: scenario.organization_id,
      scenario_id: scenarioId,
      key: a.key!,
      value: a.value!.toString(),
      category: a.category || 'general',
      description: a.description || null,
    }));

    const { error } = await supabase
      .from('assumptions')
      .upsert(records, {
        onConflict: 'scenario_id,key',
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error bulk updating assumptions:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update assumptions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assumptions?scenarioId=xxx&key=yyy
 * Deletes a specific assumption
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenarioId = searchParams.get('scenarioId');
  const key = searchParams.get('key');

  if (!scenarioId || !key) {
    return NextResponse.json(
      { error: 'scenarioId and key are required' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('assumptions')
      .delete()
      .eq('scenario_id', scenarioId)
      .eq('key', key);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assumption:', error);
    return NextResponse.json(
      { error: 'Failed to delete assumption' },
      { status: 500 }
    );
  }
}
