import { NextResponse } from 'next/server';
import { getWarrantiedVehicles } from '../../../src/queries/vehicle-list';

export async function GET() {
  try {
    const vehicles = await getWarrantiedVehicles();
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}
