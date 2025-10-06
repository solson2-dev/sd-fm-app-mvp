import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json(
      { error: 'organizationId is required' },
      { status: 400 }
    );
  }

  try {
    const { data: scenarios, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, name, description, createdBy } = body;

    if (!organizationId || !name || !createdBy) {
      return NextResponse.json(
        { error: 'organizationId, name, and createdBy are required' },
        { status: 400 }
      );
    }

    const { data: scenario, error } = await supabase
      .from('scenarios')
      .insert({
        organization_id: organizationId,
        name,
        description,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error('Error creating scenario:', error);
    return NextResponse.json(
      { error: 'Failed to create scenario' },
      { status: 500 }
    );
  }
}
