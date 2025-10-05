import { NextResponse } from 'next/server';
import {
  getRevenueAssumptions,
  getRevenueProjections,
  saveRevenueProjections,
} from '@/lib/db/revenue';
import {
  calculateRevenueProjections,
  getDefaultRevenueAssumptions,
} from '@/lib/calculations/revenue';

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
    const projections = await getRevenueProjections(scenarioId);
    return NextResponse.json({ projections });
  } catch (error) {
    console.error('Error fetching revenue projections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue projections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, years = 10 } = body as {
      scenarioId: string;
      years?: number;
    };

    if (!scenarioId) {
      return NextResponse.json(
        { error: 'scenarioId is required' },
        { status: 400 }
      );
    }

    // Get assumptions
    let assumptions = await getRevenueAssumptions(scenarioId);

    // Use defaults if no assumptions exist
    if (!assumptions) {
      assumptions = getDefaultRevenueAssumptions();
    }

    // Calculate projections
    const projections = calculateRevenueProjections(years, assumptions);

    // Save projections
    await saveRevenueProjections(scenarioId, projections);

    // Return projections
    return NextResponse.json({
      success: true,
      projections,
    });
  } catch (error) {
    console.error('Error calculating revenue projections:', error);
    return NextResponse.json(
      { error: 'Failed to calculate revenue projections' },
      { status: 500 }
    );
  }
}
