import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getWarrantiedVehicles } from '../../../../../src/queries/vehicle-list';
import { buildVehicleReport, getDefaultPeriod, type FleetReport, type VehicleReport } from '../../../../../src/aggregator';
import { generateFleetReportPdf } from '../../../../../src/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer: string }> }
) {
  try {
    const { customer } = await params;
    const searchParams = request.nextUrl.searchParams;

    const defaultPeriod = getDefaultPeriod();
    const startDate = searchParams.get('start')
      ? new Date(searchParams.get('start')!)
      : defaultPeriod.startDate;
    const endDate = searchParams.get('end')
      ? new Date(searchParams.get('end')!)
      : defaultPeriod.endDate;

    const allVehicles = await getWarrantiedVehicles();
    const customerVehicles = allVehicles.filter(v => v.pluspcustomer === customer);

    if (customerVehicles.length === 0) {
      return NextResponse.json({ error: 'No vehicles found for this customer' }, { status: 404 });
    }

    const vehicleReports: VehicleReport[] = [];
    for (const vehicle of customerVehicles) {
      const report = await buildVehicleReport(vehicle, startDate, endDate);
      vehicleReports.push(report);
    }

    // Reuse summary logic
    const totalDowntimeHours = vehicleReports.reduce((s, v) => s + v.parameters.downtimeDays, 0);
    const totalLaborCost = vehicleReports.reduce((s, v) => s + v.spending.laborCost, 0);
    const totalMaterialCost = vehicleReports.reduce((s, v) => s + v.spending.materialCost, 0);

    const fleetReport: FleetReport = {
      customer,
      customerName: customerVehicles[0].customerName,
      vehicleCount: customerVehicles.length,
      period: { startDate, endDate },
      vehicles: vehicleReports,
      summary: {
        totalDowntimeHours,
        avgDowntimeDays: vehicleReports.length > 0 ? Math.round(totalDowntimeHours / vehicleReports.length) : 0,
        totalCBJ: vehicleReports.reduce((s, v) => s + v.parameters.cbjCount, 0),
        totalBreakdown: vehicleReports.reduce((s, v) => s + v.parameters.breakdownCount, 0),
        totalServiceCount: vehicleReports.reduce((s, v) => s + v.maintenance.serviceCount, 0),
        totalRepairCount: vehicleReports.reduce((s, v) => s + v.maintenance.repairCount, 0),
        totalLaborCost: Math.round(totalLaborCost * 100) / 100,
        totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
        totalCost: Math.round((totalLaborCost + totalMaterialCost) * 100) / 100,
        avgCostPerKm: null,
        overdueVehicles: vehicleReports.filter(v => v.schedule.serviceOverdue).map(v => v.vehicle.assetnum),
        worstDowntime: null,
        worstCBJ: null,
      },
      generatedAt: new Date(),
    };

    const pdfPath = await generateFleetReportPdf(fleetReport);
    const pdfBuffer = fs.readFileSync(pdfPath);
    const filename = `fleet-report-${customer}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate fleet PDF:', error);
    return NextResponse.json({ error: 'Failed to generate fleet PDF' }, { status: 500 });
  }
}
