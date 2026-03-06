import { useState, useEffect } from 'react';
import { getAllWarehouses, Warehouse as WarehouseType } from '../../../services/api/warehouseService';
import SellerServiceMap from '../components/SellerServiceMap';

interface WarehouseLocationItem {
  _id: string;
  warehouseName: string;
  managerName: string;
  email: string;
  phone: string;
  address: string;
  latitude?: string;
  longitude?: string;
  serviceRadiusKm?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export default function AdminSellerLocation() {
  const [warehouses, setWarehouses] = useState<WarehouseLocationItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseLocationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED'>('All');

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await getAllWarehouses();
        if (response.success && response.data) {
          const mappedWarehouses: WarehouseLocationItem[] = response.data.map((warehouse: WarehouseType) => {
            const coords = warehouse.location?.coordinates;
            const latitude = coords && coords.length === 2 ? String(coords[1]) : undefined;
            const longitude = coords && coords.length === 2 ? String(coords[0]) : undefined;

            return {
              _id: warehouse._id,
              warehouseName: warehouse.warehouseName || warehouse.storeName || 'Unknown Warehouse',
              managerName: warehouse.managerName || 'Unknown',
              email: warehouse.email || '',
              phone: warehouse.mobile || '',
              address: warehouse.address || '',
              latitude,
              longitude,
              serviceRadiusKm: (warehouse as any).serviceRadiusKm || 50,
              status: warehouse.status || 'INACTIVE',
            };
          });

          const warehousesWithLocation = mappedWarehouses.filter(
            (warehouse) => warehouse.latitude && warehouse.longitude
          );

          setWarehouses(warehousesWithLocation);
        } else {
          setWarehouses([]);
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        setWarehouses([]);
      }
    };

    fetchWarehouses();
  }, []);

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const matchesSearch =
      warehouse.warehouseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || warehouse.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleWarehouseClick = (warehouse: WarehouseLocationItem) => {
    setSelectedWarehouse(warehouse);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-2xl font-semibold text-neutral-800">Warehouse Locations</h1>
        <div className="text-sm text-neutral-600">
          <span className="text-teal-600 hover:text-teal-700 cursor-pointer">Home</span>
          <span className="mx-2">/</span>
          <span className="text-neutral-800">Warehouse Locations</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Search Warehouses
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by warehouse name, manager, or address..."
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="All">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="bg-teal-600 px-4 sm:px-6 py-3">
            <h2 className="text-white text-lg font-semibold">Warehouse Locations Map</h2>
          </div>
          <div className="h-96 sm:h-[600px] w-full">
            {selectedWarehouse && selectedWarehouse.latitude && selectedWarehouse.longitude ? (
              <SellerServiceMap
                latitude={parseFloat(selectedWarehouse.latitude)}
                longitude={parseFloat(selectedWarehouse.longitude)}
                radiusKm={selectedWarehouse.serviceRadiusKm || 50}
                storeName={selectedWarehouse.warehouseName}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-neutral-50 text-neutral-500">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-neutral-300">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <p className="text-lg font-medium">Select a warehouse to view service area</p>
                <p className="text-sm mt-1">Only warehouses with coordinates are listed</p>
              </div>
            )}
          </div>
          {selectedWarehouse && (
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-teal-50">
              <h3 className="font-semibold text-neutral-900 mb-2">Selected Warehouse</h3>
              <p className="text-sm text-neutral-700">
                <span className="font-medium">{selectedWarehouse.warehouseName}</span> - {selectedWarehouse.managerName}
              </p>
              <p className="text-sm text-neutral-600 mt-1">{selectedWarehouse.address}</p>
              {selectedWarehouse.latitude && selectedWarehouse.longitude && (
                <p className="text-xs text-neutral-500 mt-1">
                  Coordinates: {selectedWarehouse.latitude}, {selectedWarehouse.longitude}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="bg-teal-600 px-4 sm:px-6 py-3">
            <h2 className="text-white text-lg font-semibold">
              Warehouses ({filteredWarehouses.length})
            </h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {filteredWarehouses.length === 0 ? (
              <div className="p-6 text-center text-neutral-500">
                <p>No warehouses found with location data.</p>
                <p className="text-sm mt-2">Make sure warehouses have valid location coordinates.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {filteredWarehouses.map((warehouse) => (
                  <div
                    key={warehouse._id}
                    onClick={() => handleWarehouseClick(warehouse)}
                    className={`p-4 cursor-pointer transition-colors ${selectedWarehouse?._id === warehouse._id
                      ? 'bg-teal-50 border-l-4 border-teal-600'
                      : 'hover:bg-neutral-50'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900 text-sm">
                          {warehouse.warehouseName}
                        </h3>
                        <p className="text-xs text-neutral-600 mt-1">{warehouse.managerName}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                          warehouse.status
                        )}`}
                      >
                        {warehouse.status}
                      </span>
                    </div>
                    {warehouse.address && (
                      <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{warehouse.address}</p>
                    )}
                    {warehouse.latitude && warehouse.longitude && (
                      <p className="text-xs text-neutral-400 mt-1">
                        {warehouse.latitude}, {warehouse.longitude}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                      <span>{warehouse.phone}</span>
                      {warehouse.email && <span>{warehouse.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-neutral-500 py-4">
        Copyright (c) 2025. Developed By{' '}
        <a href="#" className="text-teal-600 hover:text-teal-700">
          Inor fresh - 10 Minute App
        </a>
      </div>
    </div>
  );
}
