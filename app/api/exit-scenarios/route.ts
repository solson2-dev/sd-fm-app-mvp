import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import {
  calculateExitValuation,
  calculateExitReturns,
  generateCapTable,
} from '@/lib/calculations/equity';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenarioId = searchParams.get('scenarioId');
  const exitYear = parseInt(searchParams.get('exitYear') || '5');

  if (!scenarioId) {
    return NextResponse.json(
      { error: 'scenarioId is required' },
      { status: 400 }
    );
  }

  try {
    // Get revenue projections and EBITDA for exit year
    const { data: projectionData, error: projectionError } = await supabase
      .from('annual_projections')
      .select('arr, total_revenue, total_opex, gross_profit')
      .eq('scenario_id', scenarioId)
      .eq('year_number', exitYear)
      .single();

    if (projectionError && projectionError.code !== 'PGRST116') throw projectionError;

    // Get funding rounds
    const { data: fundingRounds, error: fundingError } = await supabase
      .from('funding_rounds')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('close_date');

    if (fundingError) throw fundingError;

    // Get founders and ESOP
    const { data: foundersData, error: foundersError } = await supabase
      .from('assumptions')
      .select('*')
      .eq('scenario_id', scenarioId)
      .like('key', 'founder_%');

    if (foundersError) throw foundersError;

    const { data: esopData } = await supabase
      .from('assumptions')
      .select('*')
      .eq('scenario_id', scenarioId)
      .eq('key', 'esop_pool_size')
      .single();

    // Parse founders
    const founders = foundersData
      ?.filter((f) => f.key.startsWith('founder_') && f.key.endsWith('_ownership'))
      .map((f) => {
        const name = f.key.replace('founder_', '').replace('_ownership', '');
        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          ownership: parseFloat(f.value),
        };
      }) || [
        { name: 'Founder 1', ownership: 0.6 },
        { name: 'Founder 2', ownership: 0.4 },
      ];

    const esopPoolSize = esopData ? parseFloat(esopData.value) : 0.15;

    // Generate cap table to get equity ownership per round (with ESOP refresh)
    const capTable = generateCapTable(
      founders,
      esopPoolSize,
      (fundingRounds || []).map((r) => ({
        roundName: r.round_name,
        amount: r.amount_raised || 0,
        valuation: r.post_money_valuation || 0,
        esopRefresh: r.esop_refresh_target || undefined,
      }))
    );

    const arr = projectionData?.arr || 0;
    // Calculate EBITDA as gross_profit - opex (simplified)
    const ebitda = (projectionData?.gross_profit || 0) - (projectionData?.total_opex || 0);

    // Calculate exit scenarios with different multiples
    // Based on Excel Reference_Exit Senarios sheet: 2x, 3x, 5x, 6x, 8x, 10x, 15x, 20x, 25x
    const exitMultiples = [2, 3, 5, 6, 8, 10, 15, 20, 25];

    const scenarios = exitMultiples.map((multiple) => {
      // Use same multiple for both ARR and EBITDA valuation, then average
      const exitValuation = calculateExitValuation(
        arr,
        ebitda,
        multiple,
        multiple,
        'average'
      );

      // Calculate returns for each funding round
      const roundReturns = (fundingRounds || []).map((round) => {
        const investorEntry = capTable.find(
          (e) => e.roundName === round.round_name
        );
        const equityOwnership = investorEntry?.ownership || 0;

        const roundYear =
          new Date(round.close_date).getFullYear() -
          new Date().getFullYear() +
          1;

        const returns = calculateExitReturns(
          exitYear,
          exitValuation,
          round.amount_raised || 0,
          equityOwnership,
          roundYear
        );

        return {
          roundName: round.round_name,
          investment: round.amount_raised || 0,
          equityOwnership,
          ...returns,
        };
      });

      return {
        multiple: multiple,
        arrMultiple: multiple,
        ebitdaMultiple: multiple,
        exitValuation,
        roundReturns,
      };
    });

    return NextResponse.json({
      exitYear,
      arr,
      ebitda,
      scenarios,
      capTable,
    });
  } catch (error) {
    console.error('Error generating exit scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to generate exit scenarios' },
      { status: 500 }
    );
  }
}
