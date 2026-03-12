import { NextRequest, NextResponse } from 'next/server';
import { getWarrantiedVehicles, getFleetCustomers } from '../../../../../src/queries/vehicle-list';
import { buildVehicleReport, getDefaultPeriod, type FleetReport, type FleetSummary, type VehicleReport } from '../../../../../src/aggregator';

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

    // Get all warrantied vehicles and filter to this customer
    const allVehicles = await getWarrantiedVehicles();
    const customerVehicles = allVehicles.filter(v => v.pluspcustomer === customer);

    if (customerVehicles.length === 0) {
      return NextResponse.json({ error: 'No vehicles found for this customer' }, { status: 404 });
    }

    // Build reports for each vehicle
    const vehicleReports: VehicleReport[] = [];
    for (const vehicle of customerVehicles) {
      const report = await buildVehicleReport(vehicle, startDate, endDate);
      vehicleReports.push(report);
    }

    // Build fleet summary
    const summary = buildFleetSummaryFromReports(vehicleReports);

    const fleetReport: FleetReport = {
      customer,
      customerName: customerVehicles[0].customerName,
      vehicleCount: customerVehicles.length,
      period: { startDate, endDate },
      vehicles: vehicleReports,
      summary,
      generatedAt: new Date(),
    };

    return NextResponse.json(fleetReport);
  } catch (error) {
    console.error('Failed to build fleet report:', error);
    return NextResponse.json({ error: 'Failed to build fleet report' }, { status: 500 });
  }
}

function buildFleetSummaryFromReports(vehicles: VehicleReport[]): FleetSummary {
  const totalDowntimeDays = vehicles.reduce((s, v) => s + v.parameters.downtimeDays, 0);
  const totalDowntimeHours = vehicles.reduce((s, v) => s + v.parameters.downtimeHours, 0);
  const totalCBJ = vehicles.reduce((s, v) => s + v.parameters.cbjCount, 0);
  const totalBreakdown = vehicles.reduce((s, v) => s + v.parameters.breakdownCount, 0);
  const totalServiceCount = vehicles.reduce((s, v) => s + v.maintenance.serviceCount, 0);
  const totalRepairCount = vehicles.reduce((s, v) => s + v.maintenance.repairCount, 0);
  const totalLaborCost = vehicles.reduce((s, v) => s + v.spending.laborCost, 0);
  const totalMaterialCost = vehicles.reduce((s, v) => s + v.spending.materialCost, 0);
  const totalCost = totalLaborCost + totalMaterialCost;

  const validCostPerKm = vehicles.filter(v => v.spending.costPerKm !== null);
  const avgCostPerKm = validCostPerKm.length > 0
    ? Math.round(validCostPerKm.reduce((s, v) => s + v.spending.costPerKm!, 0) / validCostPerKm.length * 100) / 100
    : null;

  const overdueVehicles = vehicles
    .filter(v => v.schedule.serviceOverdue)
    .map(v => v.vehicle.assetnum);

  const worstDowntime = vehicles.length > 0
    ? vehicles.reduce((worst, v) =>
        v.parameters.downtimeDays > (worst?.days ?? 0)
          ? { assetnum: v.vehicle.assetnum, days: v.parameters.downtimeDays, hours: v.parameters.downtimeHours }
          : worst,
        null as { assetnum: string; days: number; hours: number } | null)
    : null;

  const worstCBJ = vehicles.length > 0
    ? vehicles.reduce((worst, v) =>
        v.parameters.cbjCount > (worst?.count ?? 0)
          ? { assetnum: v.vehicle.assetnum, count: v.parameters.cbjCount }
          : worst,
        null as { assetnum: string; count: number } | null)
    : null;

  return {
    totalDowntimeDays,
    totalDowntimeHours,
    avgDowntimeDays: vehicles.length > 0 ? Math.round(totalDowntimeDays / vehicles.length) : 0,
    avgDowntimeHours: vehicles.length > 0 ? Math.round(totalDowntimeHours / vehicles.length) : 0,
    totalCBJ,
    totalBreakdown,
    totalServiceCount,
    totalRepairCount,
    totalLaborCost: Math.round(totalLaborCost * 100) / 100,
    totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    avgCostPerKm,
    overdueVehicles,
    worstDowntime,
    worstCBJ,
  };
}
