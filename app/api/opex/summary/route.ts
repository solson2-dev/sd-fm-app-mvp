import { NextResponse } from 'next/server';
import { getPersonnelRoles } from '@/lib/db/personnel';
import {
  calculateMonthlyOPEX,
  calculateCumulativeOPEX,
} from '@/lib/calculations/opex';
import { calculateHeadcount } from '@/lib/calculations/personnel';

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
    const roles = await getPersonnelRoles(scenarioId);

    // Calculate key metrics
    const month12 = calculateMonthlyOPEX(roles, 12);
    const month36 = calculateMonthlyOPEX(roles, 36);
    const cumulativeMonth12 = calculateCumulativeOPEX(roles, 12);
    const cumulativeMonth36 = calculateCumulativeOPEX(roles, 36);
    const headcountMonth12 = calculateHeadcount(roles, 12);
    const headcountMonth36 = calculateHeadcount(roles, 36);

    return NextResponse.json({
      month12: {
        personnelCost: month12.personnelCost,
        totalOPEX: month12.totalOPEX,
        headcount: headcountMonth12,
        cumulative: cumulativeMonth12,
      },
      month36: {
        personnelCost: month36.personnelCost,
        totalOPEX: month36.totalOPEX,
        headcount: headcountMonth36,
        cumulative: cumulativeMonth36,
      },
    });
  } catch (error) {
    console.error('Error calculating OPEX summary:', error);
    return NextResponse.json(
      { error: 'Failed to calculate OPEX summary' },
      { status: 500 }
    );
  }
}
