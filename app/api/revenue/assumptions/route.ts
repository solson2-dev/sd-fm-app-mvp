import { NextResponse } from 'next/server';
import {
  getRevenueAssumptions,
  saveRevenueAssumptions,
} from '@/lib/db/revenue';
import {
  RevenueAssumptions,
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
    let assumptions = await getRevenueAssumptions(scenarioId);

    // If no assumptions exist, return defaults
    if (!assumptions) {
      assumptions = getDefaultRevenueAssumptions();
    }

    return NextResponse.json({ assumptions });
  } catch (error) {
    console.error('Error fetching revenue assumptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue assumptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, assumptions } = body as {
      scenarioId: string;
      assumptions: RevenueAssumptions;
    };

    if (!scenarioId || !assumptions) {
      return NextResponse.json(
        { error: 'scenarioId and assumptions are required' },
        { status: 400 }
      );
    }

    await saveRevenueAssumptions(scenarioId, assumptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving revenue assumptions:', error);
    return NextResponse.json(
      { error: 'Failed to save revenue assumptions' },
      { status: 500 }
    );
  }
}
