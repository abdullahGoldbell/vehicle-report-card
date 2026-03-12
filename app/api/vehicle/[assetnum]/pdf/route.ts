import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getVehicleByAssetNum } from '../../../../../src/queries/vehicle-list';
import { buildVehicleReport, getDefaultPeriod } from '../../../../../src/aggregator';
import { generateVehicleReportPdf } from '../../../../../src/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetnum: string }> }
) {
  try {
    const { assetnum } = await params;
    const searchParams = request.nextUrl.searchParams;

    const vehicle = await getVehicleByAssetNum(assetnum);
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const defaultPeriod = getDefaultPeriod();
    const startDate = searchParams.get('start')
      ? new Date(searchParams.get('start')!)
      : defaultPeriod.startDate;
    const endDate = searchParams.get('end')
      ? new Date(searchParams.get('end')!)
      : defaultPeriod.endDate;

    const report = await buildVehicleReport(vehicle, startDate, endDate);
    const pdfPath = await generateVehicleReportPdf(report);

    const pdfBuffer = fs.readFileSync(pdfPath);
    const filename = `vehicle-report-${vehicle.vehicleNo || assetnum}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
