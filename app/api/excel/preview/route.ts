/**
 * Excel Preview API
 *
 * Parses and validates Excel files without committing to database
 * Provides preview data and conflict detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { parseExcelFile } from '@/lib/excel/import';
import { validateImportData, validateFileType, validateFileSize } from '@/lib/excel/validation';
import type { ImportPreview, ConflictInfo } from '@/lib/excel/types';

// ============================================================================
// POST - Preview Excel Import
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const scenarioId = formData.get('scenarioId') as string;
    const organizationId = formData.get('organizationId') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!scenarioId) {
      return NextResponse.json(
        { success: false, error: 'Scenario ID is required' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileTypeError = validateFileType(file);
    if (fileTypeError) {
      return NextResponse.json(
        { success: false, error: fileTypeError.message },
        { status: 400 }
      );
    }

    // Validate file size
    const fileSizeError = validateFileSize(file, 10);
    if (fileSizeError) {
      return NextResponse.json(
        { success: false, error: fileSizeError.message },
        { status: 400 }
      );
    }

    // Parse Excel file
    const workbookData = await parseExcelFile(file);

    // Validate data
    const validation = validateImportData(workbookData);

    // Check for conflicts with existing data
    const conflicts = await detectConflicts(scenarioId, organizationId, workbookData);

    // Build preview response
    const preview: ImportPreview = {
      workbookData,
      validation,
      conflicts,
    };

    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error('Excel preview error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Preview failed',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Conflict Detection
// ============================================================================

/**
 * Detect conflicts between imported data and existing database records
 */
async function detectConflicts(
  scenarioId: string,
  organizationId: string,
  workbookData: import('@/lib/excel/types').WorkbookData
): Promise<ConflictInfo[]> {
  const supabase = getSupabaseClient();
  const conflicts: ConflictInfo[] = [];

  try {
    // Check Assumptions
    if (workbookData.assumptions.length > 0) {
      const { count: existingCount } = await supabase
        .from('assumptions')
        .select('id', { count: 'exact', head: true })
        .eq('scenario_id', scenarioId)
        .eq('organization_id', organizationId);

      if (existingCount && existingCount > 0) {
        conflicts.push({
          type: 'assumptions',
          existingRecords: existingCount,
          newRecords: workbookData.assumptions.length,
          message: `${existingCount} existing assumption(s) will be updated with ${workbookData.assumptions.length} imported record(s)`,
        });
      }
    }

    // Check Revenue Projections
    if (workbookData.revenueProjections.length > 0) {
      const { count: existingCount } = await supabase
        .from('annual_projections')
        .select('id', { count: 'exact', head: true })
        .eq('scenario_id', scenarioId)
        .eq('organization_id', organizationId);

      if (existingCount && existingCount > 0) {
        conflicts.push({
          type: 'revenue',
          existingRecords: existingCount,
          newRecords: workbookData.revenueProjections.length,
          message: `${existingCount} existing revenue projection(s) will be updated with ${workbookData.revenueProjections.length} imported record(s)`,
        });
      }
    }

    // Check OPEX Projections
    if (workbookData.opexProjections.length > 0) {
      const { count: existingCount } = await supabase
        .from('monthly_opex_projections')
        .select('id', { count: 'exact', head: true })
        .eq('scenario_id', scenarioId);

      if (existingCount && existingCount > 0) {
        conflicts.push({
          type: 'opex',
          existingRecords: existingCount,
          newRecords: workbookData.opexProjections.length,
          message: `${existingCount} existing OPEX projection(s) will be updated with ${workbookData.opexProjections.length} imported record(s)`,
        });
      }
    }

    // Check Personnel Roles
    if (workbookData.personnelRoles.length > 0) {
      const { count: existingCount } = await supabase
        .from('personnel_roles')
        .select('id', { count: 'exact', head: true })
        .eq('scenario_id', scenarioId);

      if (existingCount && existingCount > 0) {
        conflicts.push({
          type: 'personnel',
          existingRecords: existingCount,
          newRecords: workbookData.personnelRoles.length,
          message: `${existingCount} existing personnel role(s) found. New roles will be added (use Replace mode to overwrite).`,
        });
      }
    }

    // Check Funding Rounds
    if (workbookData.fundingRounds.length > 0) {
      const { count: existingCount } = await supabase
        .from('funding_rounds')
        .select('id', { count: 'exact', head: true })
        .eq('scenario_id', scenarioId);

      if (existingCount && existingCount > 0) {
        conflicts.push({
          type: 'funding',
          existingRecords: existingCount,
          newRecords: workbookData.fundingRounds.length,
          message: `${existingCount} existing funding round(s) found. New rounds will be added (use Replace mode to overwrite).`,
        });
      }
    }

    return conflicts;
  } catch (error) {
    console.error('Error detecting conflicts:', error);
    return conflicts;
  }
}
