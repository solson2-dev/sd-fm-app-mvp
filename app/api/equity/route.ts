import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import {
  generateCapTable,
  calculateExitValuation,
  calculateExitReturns,
} from '@/lib/calculations/equity';

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
    // Get founders
    const { data: foundersData, error: foundersError } = await supabase
      .from('assumptions')
      .select('*')
      .eq('scenario_id', scenarioId)
      .like('key', 'founder_%');

    if (foundersError) throw foundersError;

    // Get ESOP pool size
    const { data: esopData, error: esopError } = await supabase
      .from('assumptions')
      .select('*')
      .eq('scenario_id', scenarioId)
      .eq('key', 'esop_pool_size')
      .single();

    if (esopError && esopError.code !== 'PGRST116') throw esopError;

    // Get funding rounds
    const { data: fundingRounds, error: fundingError } = await supabase
      .from('funding_rounds')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('close_date');

    if (fundingError) throw fundingError;

    // Parse founders
    const founders = foundersData
      ?.filter((f) => f.key.startsWith('founder_') && f.key.endsWith('_ownership'))
      .map((f) => {
        const name = f.key.replace('founder_', '').replace('_ownership', '');
        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          ownership: parseFloat(f.value),
        };
      }) || [];

    const esopPoolSize = esopData ? parseFloat(esopData.value) : 0.15; // Default 15%

    // Generate cap table
    const capTable = generateCapTable(
      founders.length > 0 ? founders : [
        { name: 'Founder 1', ownership: 0.6 },
        { name: 'Founder 2', ownership: 0.4 },
      ],
      esopPoolSize,
      (fundingRounds || []).map((r) => ({
        roundName: r.round_name,
        amount: r.amount_raised || 0,
        valuation: r.post_money_valuation || 0,
      }))
    );

    return NextResponse.json({
      capTable,
      founders,
      esopPoolSize,
      fundingRounds: fundingRounds || [],
    });
  } catch (error) {
    console.error('Error generating cap table:', error);
    return NextResponse.json(
      { error: 'Failed to generate cap table' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, founders, esopPoolSize } = body;

    if (!scenarioId) {
      return NextResponse.json(
        { error: 'scenarioId is required' },
        { status: 400 }
      );
    }

    // Delete existing founder assumptions
    await supabase
      .from('assumptions')
      .delete()
      .eq('scenario_id', scenarioId)
      .like('key', 'founder_%');

    // Save founder equity
    const founderRecords = founders.flatMap((f: any) => [
      {
        scenario_id: scenarioId,
        key: `founder_${f.name.toLowerCase()}_ownership`,
        value: f.ownership.toString(),
      },
    ]);

    if (founderRecords.length > 0) {
      const { error: founderError } = await supabase
        .from('assumptions')
        .insert(founderRecords);

      if (founderError) throw founderError;
    }

    // Save ESOP pool size
    await supabase
      .from('assumptions')
      .delete()
      .eq('scenario_id', scenarioId)
      .eq('key', 'esop_pool_size');

    const { error: esopError } = await supabase.from('assumptions').insert({
      scenario_id: scenarioId,
      key: 'esop_pool_size',
      value: esopPoolSize.toString(),
    });

    if (esopError) throw esopError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving equity data:', error);
    return NextResponse.json(
      { error: 'Failed to save equity data' },
      { status: 500 }
    );
  }
}
