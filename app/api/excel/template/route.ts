/**
 * Excel Template Download API
 *
 * Generates and returns an Excel template for import
 */

import { NextResponse } from 'next/server';
import { generateImportTemplate } from '@/lib/excel/template';

// ============================================================================
// GET - Download Template
// ============================================================================

export async function GET() {
  try {
    // Generate template
    const workbook = await generateImportTemplate();

    // Convert to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Financial_Model_Template.xlsx"',
        'Content-Length': buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Template generation failed',
      },
      { status: 500 }
    );
  }
}
