'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { VehicleTable } from '../components/VehicleTable';

interface Vehicle {
  assetnum: string;
  vehicleNo: string;
  description: string;
  serialnum: string;
  pluspcustomer: string;
  customerName: string;
  agreement: string;
  warrantyStart: string | null;
  warrantyEnd: string | null;
}

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/vehicles')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load vehicles');
        return res.json();
      })
      .then(setVehicles)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter(v =>
    !search ||
    v.assetnum.toLowerCase().includes(search.toLowerCase()) ||
    v.vehicleNo?.toLowerCase().includes(search.toLowerCase()) ||
    v.description.toLowerCase().includes(search.toLowerCase()) ||
    v.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    v.pluspcustomer?.toLowerCase().includes(search.toLowerCase())
  );

  const uniqueCustomers = new Set(vehicles.map(v => v.pluspcustomer));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Warrantied vehicles overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Total Vehicles"
          value={loading ? '...' : vehicles.length}
          variant="default"
        />
        <MetricCard
          label="Fleet Customers"
          value={loading ? '...' : uniqueCustomers.size}
          variant="default"
        />
        <MetricCard
          label="Active Agreements"
          value={loading ? '...' : new Set(vehicles.map(v => v.agreement)).size}
          variant="default"
        />
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by vehicle no, chassis, description, or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
        />
      </div>

      {/* Vehicle list */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#C8A951]" />
          <p className="text-gray-500 mt-3">Loading vehicles...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-2">
            Showing {filtered.length} of {vehicles.length} vehicles
          </p>
          <VehicleTable vehicles={filtered} />
        </>
      )}
    </div>
  );
}
