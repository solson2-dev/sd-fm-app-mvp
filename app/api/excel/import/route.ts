/**
 * Excel Import API
 *
 * Handles Excel file upload, parsing, validation, and database import
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { parseExcelFile } from '@/lib/excel/import';
import { validateImportData, validateFileType, validateFileSize } from '@/lib/excel/validation';
import type { ImportSummary, ImportOptions, WorkbookData } from '@/lib/excel/types';

// ============================================================================
// POST - Import Excel File
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const scenarioId = formData.get('scenarioId') as string;
    const organizationId = formData.get('organizationId') as string;
    const mode = (formData.get('mode') as 'merge' | 'replace') || 'merge';
    const validateOnly = formData.get('validateOnly') === 'true';

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

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // If validation-only mode, return early
    if (validateOnly) {
      return NextResponse.json({
        success: true,
        validateOnly: true,
        workbookData,
        validation,
      });
    }

    // Import data to database
    const importSummary = await importToDatabase(workbookData, {
      scenarioId,
      organizationId,
      mode,
    });

    const duration = Date.now() - startTime;
    importSummary.duration = duration;

    // Save import history
    await saveImportHistory({
      organizationId,
      scenarioId,
      fileName: file.name,
      fileSize: file.size,
      mode,
      recordsImported: importSummary.recordsImported,
      errors: importSummary.errors,
      warnings: validation.warnings,
      duration,
    });

    return NextResponse.json({
      success: true,
      summary: importSummary,
      validation,
    });
  } catch (error) {
    console.error('Excel import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Database Import Functions
// ============================================================================

/**
 * Import parsed workbook data to database
 */
async function importToDatabase(
  data: WorkbookData,
  options: ImportOptions
): Promise<ImportSummary> {
  const supabase = getSupabaseClient();
  const summary: ImportSummary = {
    success: false,
    recordsImported: {
      assumptions: 0,
      revenueProjections: 0,
      opexProjections: 0,
      personnelRoles: 0,
      fundingRounds: 0,
    },
    errors: [],
    warnings: [],
    duration: 0,
  };

  try {
    // Handle replace mode - delete existing data
    if (options.mode === 'replace') {
      await deleteExistingData(options.scenarioId, options.organizationId);
    }

    // Import Assumptions
    if (data.assumptions.length > 0) {
      const assumptionRecords = data.assumptions.map((assumption) => ({
        organization_id: options.organizationId,
        scenario_id: options.scenarioId,
        key: assumption.key,
        value: String(assumption.value),
        category: assumption.category || null,
        description: assumption.description || null,
        import_source: 'excel',
        import_metadata: {
          fileName: data.metadata.fileName,
          importedAt: data.metadata.importedAt,
        },
      }));

      const { error: assumptionError, count } = await supabase
        .from('assumptions')
        .upsert(assumptionRecords, {
          onConflict: 'scenario_id,key',
        })
        .select('id', { count: 'exact' });

      if (assumptionError) {
        summary.errors.push({
          field: 'assumptions',
          message: `Failed to import assumptions: ${assumptionError.message}`,
        });
      } else {
        summary.recordsImported.assumptions = count || 0;
      }
    }

    // Import Revenue Projections
    if (data.revenueProjections.length > 0) {
      const revenueRecords = data.revenueProjections.map((projection) => ({
        organization_id: options.organizationId,
        scenario_id: options.scenarioId,
        year: projection.year,
        year_number: projection.year - new Date().getFullYear() + 1,
        customers: projection.customers.value,
        arr: projection.arr.value,
        setup_fees: projection.setupFees.value,
        total_revenue: projection.totalRevenue.value,
        ending_customers: projection.endingCustomers?.value || null,
        // Store formulas if available
        arr_formula: projection.arr.formula || null,
        customers_formula: projection.customers.formula || null,
        setup_fees_formula: projection.setupFees.formula || null,
        total_revenue_formula: projection.totalRevenue.formula || null,
        ending_customers_formula: projection.endingCustomers?.formula || null,
        import_source: 'excel',
        import_metadata: {
          fileName: data.metadata.fileName,
          importedAt: data.metadata.importedAt,
        },
      }));

      const { error: revenueError, count } = await supabase
        .from('annual_projections')
        .upsert(revenueRecords, {
          onConflict: 'scenario_id,year',
        })
        .select('id', { count: 'exact' });

      if (revenueError) {
        summary.errors.push({
          field: 'revenue_projections',
          message: `Failed to import revenue projections: ${revenueError.message}`,
        });
      } else {
        summary.recordsImported.revenueProjections = count || 0;
      }
    }

    // Import OPEX Projections
    if (data.opexProjections.length > 0) {
      const opexRecords = data.opexProjections.map((projection) => ({
        scenario_id: options.scenarioId,
        month: projection.month,
        personnel_cost: projection.personnelCost.value,
        headcount: projection.headcount.value,
        marketing: projection.marketing.value,
        sales: projection.sales.value,
        infrastructure: projection.infrastructure.value,
        facilities: projection.facilities.value,
        professional_services: projection.professionalServices.value,
        other: projection.other.value,
        total_opex: projection.totalOpex.value,
        cumulative_opex: projection.cumulativeOpex?.value || null,
        // Store formulas if available
        personnel_cost_formula: projection.personnelCost.formula || null,
        headcount_formula: projection.headcount.formula || null,
        marketing_formula: projection.marketing.formula || null,
        sales_formula: projection.sales.formula || null,
        infrastructure_formula: projection.infrastructure.formula || null,
        facilities_formula: projection.facilities.formula || null,
        professional_services_formula: projection.professionalServices.formula || null,
        other_formula: projection.other.formula || null,
        total_opex_formula: projection.totalOpex.formula || null,
        cumulative_opex_formula: projection.cumulativeOpex?.formula || null,
        import_source: 'excel',
        import_metadata: {
          fileName: data.metadata.fileName,
          importedAt: data.metadata.importedAt,
        },
      }));

      const { error: opexError, count } = await supabase
        .from('monthly_opex_projections')
        .upsert(opexRecords, {
          onConflict: 'scenario_id,month',
        })
        .select('id', { count: 'exact' });

      if (opexError) {
        summary.errors.push({
          field: 'opex_projections',
          message: `Failed to import OPEX projections: ${opexError.message}`,
        });
      } else {
        summary.recordsImported.opexProjections = count || 0;
      }
    }

    // Import Personnel Roles
    if (data.personnelRoles.length > 0) {
      const personnelRecords = data.personnelRoles.map((role) => ({
        scenario_id: options.scenarioId,
        role_name: role.roleName,
        base_salary: role.baseSalary,
        start_month: role.startMonth,
        end_month: role.endMonth || null,
        department: role.department || null,
        import_source: 'excel',
        import_metadata: {
          fileName: data.metadata.fileName,
          importedAt: data.metadata.importedAt,
        },
      }));

      const { error: personnelError, count } = await supabase
        .from('personnel_roles')
        .insert(personnelRecords)
        .select('id', { count: 'exact' });

      if (personnelError) {
        summary.errors.push({
          field: 'personnel_roles',
          message: `Failed to import personnel roles: ${personnelError.message}`,
        });
      } else {
        summary.recordsImported.personnelRoles = count || 0;
      }
    }

    // Import Funding Rounds
    if (data.fundingRounds.length > 0) {
      const fundingRecords = data.fundingRounds.map((round) => ({
        scenario_id: options.scenarioId,
        round_name: round.roundName,
        amount_raised: round.amountRaised,
        pre_money_valuation: round.preMoneyValuation || null,
        post_money_valuation: round.postMoneyValuation,
        price_per_share: round.pricePerShare || null,
        shares_issued: round.sharesIssued || null,
        investor_ownership: round.investorOwnership || null,
        close_date: round.closeDate,
        close_month: round.closeMonth || null,
        esop_refresh_target: round.esopRefreshTarget || null,
        import_source: 'excel',
        import_metadata: {
          fileName: data.metadata.fileName,
          importedAt: data.metadata.importedAt,
        },
      }));

      const { error: fundingError, count } = await supabase
        .from('funding_rounds')
        .insert(fundingRecords)
        .select('id', { count: 'exact' });

      if (fundingError) {
        summary.errors.push({
          field: 'funding_rounds',
          message: `Failed to import funding rounds: ${fundingError.message}`,
        });
      } else {
        summary.recordsImported.fundingRounds = count || 0;
      }
    }

    // Determine overall success
    summary.success = summary.errors.length === 0;

    return summary;
  } catch (error) {
    summary.errors.push({
      field: 'import',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return summary;
  }
}

/**
 * Delete existing data for a scenario (replace mode)
 */
async function deleteExistingData(scenarioId: string, organizationId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // Delete in order to respect foreign key constraints
  await supabase
    .from('assumptions')
    .delete()
    .eq('scenario_id', scenarioId)
    .eq('organization_id', organizationId);

  await supabase
    .from('annual_projections')
    .delete()
    .eq('scenario_id', scenarioId)
    .eq('organization_id', organizationId);

  await supabase
    .from('monthly_opex_projections')
    .delete()
    .eq('scenario_id', scenarioId);

  await supabase
    .from('personnel_roles')
    .delete()
    .eq('scenario_id', scenarioId);

  await supabase
    .from('funding_rounds')
    .delete()
    .eq('scenario_id', scenarioId);
}

/**
 * Save import history record
 */
async function saveImportHistory(historyData: {
  organizationId: string;
  scenarioId: string;
  fileName: string;
  fileSize: number;
  mode: 'merge' | 'replace';
  recordsImported: any;
  errors: any[];
  warnings: any[];
  duration: number;
}): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    await supabase.from('import_history').insert({
      organization_id: historyData.organizationId,
      scenario_id: historyData.scenarioId,
      file_name: historyData.fileName,
      file_size: historyData.fileSize,
      import_mode: historyData.mode,
      records_imported: historyData.recordsImported,
      errors: historyData.errors.length > 0 ? historyData.errors : null,
      warnings: historyData.warnings.length > 0 ? historyData.warnings : null,
      duration_ms: historyData.duration,
    });
  } catch (error) {
    // Log error but don't fail the import
    console.error('Failed to save import history:', error);
  }
}
