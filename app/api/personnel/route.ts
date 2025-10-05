import { NextResponse } from 'next/server';
import { getPersonnelRoles, upsertPersonnelRoles } from '@/lib/db/personnel';
import { PersonnelRole } from '@/lib/calculations/personnel';

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
    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching personnel roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personnel roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, roles } = body as {
      scenarioId: string;
      roles: PersonnelRole[];
    };

    if (!scenarioId || !roles) {
      return NextResponse.json(
        { error: 'scenarioId and roles are required' },
        { status: 400 }
      );
    }

    await upsertPersonnelRoles(scenarioId, roles);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving personnel roles:', error);
    return NextResponse.json(
      { error: 'Failed to save personnel roles' },
      { status: 500 }
    );
  }
}
