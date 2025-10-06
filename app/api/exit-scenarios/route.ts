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
    // Get revenue projections for exit year
    const { data: revenueData, error: revenueError } = await supabase
      .from('annual_projections')
      .select('arr, revenue')
      .eq('scenario_id', scenarioId)
      .eq('year', exitYear)
      .single();

    if (revenueError && revenueError.code !== 'PGRST116') throw revenueError;

    // Get income statement for EBITDA
    const { data: incomeData, error: incomeError } = await supabase
      .from('annual_projections')
      .select('ebitda')
      .eq('scenario_id', scenarioId)
      .eq('year', exitYear)
      .single();

    if (incomeError && incomeError.code !== 'PGRST116') throw incomeError;

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

    // Generate cap table to get equity ownership per round
    const capTable = generateCapTable(
      founders,
      esopPoolSize,
      (fundingRounds || []).map((r) => ({
        roundName: r.round_name,
        amount: r.amount_raised || 0,
        valuation: r.post_money_valuation || 0,
      }))
    );

    const arr = revenueData?.arr || 0;
    const ebitda = incomeData?.ebitda || 0;

    // Calculate exit scenarios with different multiples
    const arrMultiples = [5, 7.5, 10, 12.5, 15];
    const ebitdaMultiples = [10, 12.5, 15, 17.5, 20];

    const scenarios = arrMultiples.map((arrMult, idx) => {
      const ebitdaMult = ebitdaMultiples[idx];
      const exitValuation = calculateExitValuation(
        arr,
        ebitda,
        arrMult,
        ebitdaMult,
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
        arrMultiple: arrMult,
        ebitdaMultiple: ebitdaMult,
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
