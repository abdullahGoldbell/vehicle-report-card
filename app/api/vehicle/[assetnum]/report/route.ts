import { NextRequest, NextResponse } from 'next/server';
import { getVehicleByAssetNum } from '../../../../../src/queries/vehicle-list';
import { buildVehicleReport, getDefaultPeriod } from '../../../../../src/aggregator';

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
    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to build vehicle report:', error);
    return NextResponse.json({ error: 'Failed to build report' }, { status: 500 });
  }
}
