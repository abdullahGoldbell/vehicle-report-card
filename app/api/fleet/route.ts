import { NextResponse } from 'next/server';
import { getFleetCustomers } from '../../../src/queries/vehicle-list';

export async function GET() {
  try {
    const customers = await getFleetCustomers();
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Failed to fetch fleet customers:', error);
    return NextResponse.json({ error: 'Failed to fetch fleet customers' }, { status: 500 });
  }
}
