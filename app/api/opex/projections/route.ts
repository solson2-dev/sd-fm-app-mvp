import { NextResponse } from 'next/server';
import { getPersonnelRoles } from '@/lib/db/personnel';
import { saveOPEXProjections, getOPEXProjections } from '@/lib/db/opex';

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
    const projections = await getOPEXProjections(scenarioId);
    return NextResponse.json({ projections });
  } catch (error) {
    console.error('Error fetching OPEX projections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OPEX projections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      scenarioId,
      startMonth = 1,
      endMonth = 36,
    } = body as {
      scenarioId: string;
      startMonth?: number;
      endMonth?: number;
    };

    if (!scenarioId) {
      return NextResponse.json(
        { error: 'scenarioId is required' },
        { status: 400 }
      );
    }

    // Get personnel roles
    const roles = await getPersonnelRoles(scenarioId);

    // Calculate and save projections
    await saveOPEXProjections(scenarioId, roles, startMonth, endMonth);

    // Fetch and return projections
    const projections = await getOPEXProjections(scenarioId);

    return NextResponse.json({
      success: true,
      projections
    });
  } catch (error) {
    console.error('Error calculating OPEX projections:', error);
    return NextResponse.json(
      { error: 'Failed to calculate OPEX projections' },
      { status: 500 }
    );
  }
}
