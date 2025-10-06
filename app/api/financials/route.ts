import { NextResponse } from 'next/server';
import { getRevenueProjections } from '@/lib/db/revenue';
import { supabase } from '@/lib/supabase/client';
import { generateFinancialStatements } from '@/lib/calculations/financials';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenarioId = searchParams.get('scenarioId');
  const years = parseInt(searchParams.get('years') || '10');

  if (!scenarioId) {
    return NextResponse.json(
      { error: 'scenarioId is required' },
      { status: 400 }
    );
  }

  try {
    // Get revenue projections
    const revenueProjections = await getRevenueProjections(scenarioId);

    // Get OPEX projections (annual)
    const { data: opexData, error: opexError } = await supabase
      .from('annual_projections')
      .select('year_number, total_opex')
      .eq('scenario_id', scenarioId)
      .order('year_number');

    if (opexError) throw opexError;

    // Get funding rounds
    const { data: fundingData, error: fundingError } = await supabase
      .from('funding_rounds')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('close_date');

    if (fundingError) throw fundingError;

    // Map funding to years (simplified - using year from date)
    const fundingRounds = (fundingData || []).map((f) => ({
      year: new Date(f.close_date).getFullYear() - new Date().getFullYear() + 1,
      amount: f.amount_raised || 0,
    }));

    // Prepare data for financial statements
    const revenueData = revenueProjections.map((r) => ({
      year: r.year,
      revenue: r.totalRevenue,
      cogs: r.cogs,
    }));

    const opexDataMapped = (opexData || []).map((o: any) => ({
      year: o.year_number,
      opex: o.total_opex || 0,
    }));

    // Generate financial statements
    const financials = generateFinancialStatements(
      years,
      revenueData,
      opexDataMapped,
      fundingRounds
    );

    return NextResponse.json(financials);
  } catch (error) {
    console.error('Error generating financial statements:', error);
    return NextResponse.json(
      { error: 'Failed to generate financial statements' },
      { status: 500 }
    );
  }
}
