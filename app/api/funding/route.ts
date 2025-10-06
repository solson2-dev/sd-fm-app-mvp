import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

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
    const { data: fundingRounds, error } = await supabase
      .from('funding_rounds')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('round_date');

    if (error) throw error;

    return NextResponse.json({ fundingRounds: fundingRounds || [] });
  } catch (error) {
    console.error('Error fetching funding rounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funding rounds' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, fundingRound } = body;

    if (!scenarioId || !fundingRound) {
      return NextResponse.json(
        { error: 'scenarioId and fundingRound are required' },
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

    const { data, error } = await supabase
      .from('funding_rounds')
      .insert({
        organization_id: scenario.organization_id,
        scenario_id: scenarioId,
        round_name: fundingRound.roundName,
        amount: fundingRound.amount,
        valuation: fundingRound.valuation,
        round_date: fundingRound.roundDate,
        investor_names: fundingRound.investorNames || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ fundingRound: data });
  } catch (error) {
    console.error('Error creating funding round:', error);
    return NextResponse.json(
      { error: 'Failed to create funding round' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('funding_rounds')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting funding round:', error);
    return NextResponse.json(
      { error: 'Failed to delete funding round' },
      { status: 500 }
    );
  }
}
