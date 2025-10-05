import { NextResponse } from 'next/server';
import { getRevenueAssumptions } from '@/lib/db/revenue';
import {
  calculateRevenueSummary,
  calculateCustomerProjections,
  getDefaultRevenueAssumptions,
} from '@/lib/calculations/revenue';

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
    // Get assumptions
    let assumptions = await getRevenueAssumptions(scenarioId);

    // Use defaults if no assumptions exist
    if (!assumptions) {
      assumptions = getDefaultRevenueAssumptions();
    }

    // Calculate summary
    const summary = calculateRevenueSummary(years, assumptions);

    // Calculate customer projections for chart data
    const customerProjections = calculateCustomerProjections(years, assumptions);

    return NextResponse.json({
      summary,
      customerProjections,
      assumptions,
    });
  } catch (error) {
    console.error('Error calculating revenue summary:', error);
    return NextResponse.json(
      { error: 'Failed to calculate revenue summary' },
      { status: 500 }
    );
  }
}
