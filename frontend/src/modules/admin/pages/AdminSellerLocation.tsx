import { useState, useEffect } from 'react';
import { getAllWarehouses, Warehouse as WarehouseType, updateWarehouseByAdmin } from '../../../services/api/warehouseService';
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

interface EditWarehouseState {
  id: string;
  warehouseName: string;
  address: string;
  locationQuery: string;
  latitude: string;
  longitude: string;
  serviceRadiusKm: string;
}

export default function AdminSellerLocation() {
  const [warehouses, setWarehouses] = useState<WarehouseLocationItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseLocationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED'>('All');
  const [editWarehouse, setEditWarehouse] = useState<EditWarehouseState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string>('');

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

          setWarehouses(mappedWarehouses);
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

  const openEditModal = (warehouse: WarehouseLocationItem) => {
    setEditWarehouse({
      id: warehouse._id,
      warehouseName: warehouse.warehouseName,
      address: warehouse.address || '',
      locationQuery: warehouse.address || '',
      latitude: warehouse.latitude || '',
      longitude: warehouse.longitude || '',
      serviceRadiusKm: String(warehouse.serviceRadiusKm || 50),
    });
  };

  const handleGeocodeLocation = async () => {
    if (!editWarehouse) return;
    const query = editWarehouse.locationQuery.trim();
    if (!query) {
      setError('Enter a location name (e.g. Silicon City, Indore).');
      return;
    }

    try {
      setGeocoding(true);
      setError('');
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      const results = await response.json();

      if (!Array.isArray(results) || results.length === 0) {
        setError('Location not found. Try a more specific place name.');
        return;
      }

      const first = results[0];
      setEditWarehouse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          latitude: String(first.lat),
          longitude: String(first.lon),
          address: prev.address || first.display_name || prev.address,
        };
      });
    } catch {
      setError('Unable to fetch location from map service right now.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSaveWarehouseDetails = async () => {
    if (!editWarehouse) return;

    const latitude = Number(editWarehouse.latitude);
    const longitude = Number(editWarehouse.longitude);
    const serviceRadiusKm = Number(editWarehouse.serviceRadiusKm);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError('Valid location coordinates are required. Use "Find on Map" first.');
      return;
    }
    if (Number.isNaN(serviceRadiusKm) || serviceRadiusKm < 0.1 || serviceRadiusKm > 100) {
      setError('Service radius must be between 0.1 and 100 km.');
      return;
    }

    try {
      setSavingEdit(true);
      setError('');
      const response = await updateWarehouseByAdmin(editWarehouse.id, {
        address: editWarehouse.address,
        latitude,
        longitude,
        serviceRadiusKm,
      });

      if (!response?.success || !response?.data) {
        setError(response?.message || 'Failed to update warehouse details.');
        return;
      }

      const updated = response.data;
      const coords = updated.location?.coordinates;
      const latStr = coords && coords.length === 2 ? String(coords[1]) : undefined;
      const lngStr = coords && coords.length === 2 ? String(coords[0]) : undefined;

      const updatedItem: WarehouseLocationItem = {
        _id: updated._id,
        warehouseName: updated.warehouseName || updated.storeName || 'Unknown Warehouse',
        managerName: updated.managerName || 'Unknown',
        email: updated.email || '',
        phone: updated.mobile || '',
        address: updated.address || '',
        latitude: latStr,
        longitude: lngStr,
        serviceRadiusKm: (updated as any).serviceRadiusKm || 50,
        status: updated.status || 'INACTIVE',
      };

      setWarehouses((prev) =>
        prev.map((w) => (w._id === updatedItem._id ? updatedItem : w))
      );

      if (selectedWarehouse?._id === updatedItem._id) {
        setSelectedWarehouse(updatedItem);
      }

      setEditWarehouse(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update warehouse details.');
    } finally {
      setSavingEdit(false);
    }
  };

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
        return 'bg-teal-50 text-[#12b2a2]';
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

      {error && (
        <div className="p-4 bg-red-50 text-red-700 italic border-l-4 border-red-500 rounded">{error}</div>
      )}

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
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden flex flex-col justify-between">
          <div>
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
                <div className="flex flex-col items-center justify-center h-full bg-neutral-50 text-neutral-500 p-6 text-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-neutral-300">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <p className="text-lg font-medium text-neutral-700">No Location Coordinates Set</p>
                  <p className="text-sm mt-1 text-neutral-500">
                    {selectedWarehouse 
                      ? 'Click "Edit Location" below to configure coordinates for this warehouse.' 
                      : 'Select a warehouse from the list to view its service area on the map.'}
                  </p>
                </div>
              )}
            </div>
          </div>
          {selectedWarehouse && (
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-teal-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 mb-1">Selected Warehouse</h3>
                <p className="text-sm text-neutral-700 font-medium">
                  {selectedWarehouse.warehouseName} ({selectedWarehouse.managerName})
                </p>
                <p className="text-sm text-neutral-600 mt-1">{selectedWarehouse.address}</p>
                {selectedWarehouse.latitude && selectedWarehouse.longitude ? (
                  <p className="text-xs text-neutral-500 mt-1">
                    Coordinates: {selectedWarehouse.latitude}, {selectedWarehouse.longitude} | Service Radius: {selectedWarehouse.serviceRadiusKm || 50} km
                  </p>
                ) : (
                  <p className="text-xs text-rose-500 font-semibold mt-1">
                    No coordinates configured yet.
                  </p>
                )}
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedWarehouse)}
                  className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm font-semibold transition-colors shadow-sm"
                >
                  Edit Location
                </button>
              </div>
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
                <p>No warehouses found.</p>
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
                    {warehouse.latitude && warehouse.longitude ? (
                      <p className="text-xs text-neutral-400 mt-1">
                        {warehouse.latitude}, {warehouse.longitude} (Radius: {warehouse.serviceRadiusKm || 50} km)
                      </p>
                    ) : (
                      <p className="text-xs text-rose-500 font-semibold mt-1">
                        No Location Set
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
        Copyright (c) 2026. Developed By{' '}
        <a href="#" className="text-teal-600 hover:text-teal-700">
          Inor fresh
        </a>
      </div>

      {editWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 animate-fade-in">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-6 py-4 bg-neutral-50">
              <h3 className="text-lg font-bold text-neutral-800">Edit Warehouse Location: {editWarehouse.warehouseName}</h3>
              <button
                type="button"
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 transition-colors"
                onClick={() => {
                  setEditWarehouse(null);
                  setError('');
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={editWarehouse.address}
                    onChange={(e) => setEditWarehouse((prev) => (prev ? { ...prev, address: e.target.value } : prev))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1 font-semibold">Search Location (Find Coordinates)</label>
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      placeholder="e.g. Silicon City, Indore"
                      value={editWarehouse.locationQuery}
                      onChange={(e) => setEditWarehouse((prev) => (prev ? { ...prev, locationQuery: e.target.value } : prev))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGeocodeLocation();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleGeocodeLocation}
                      disabled={geocoding}
                      className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60 transition-colors shrink-0"
                    >
                      {geocoding ? 'Finding...' : 'Find on Map'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Latitude</label>
                    <input
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      value={editWarehouse.latitude}
                      onChange={(e) => setEditWarehouse((prev) => (prev ? { ...prev, latitude: e.target.value } : prev))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Longitude</label>
                    <input
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      value={editWarehouse.longitude}
                      onChange={(e) => setEditWarehouse((prev) => (prev ? { ...prev, longitude: e.target.value } : prev))}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Service Radius (km): {editWarehouse.serviceRadiusKm} km</label>
                  <input
                    type="range"
                    min={0.1}
                    max={100}
                    step={0.1}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    value={editWarehouse.serviceRadiusKm}
                    onChange={(e) => setEditWarehouse((prev) => (prev ? { ...prev, serviceRadiusKm: e.target.value } : prev))}
                  />
                  <div className="flex justify-between text-xs text-neutral-400 mt-1">
                    <span>0.1 km</span>
                    <span>50 km</span>
                    <span>100 km</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveWarehouseDetails}
                    disabled={savingEdit}
                    className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-sm"
                  >
                    {savingEdit ? 'Saving...' : 'Save Location'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditWarehouse(null);
                      setError('');
                    }}
                    className="flex-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-2.5 text-sm font-semibold transition-colors border border-neutral-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="border border-neutral-200 rounded-lg overflow-hidden min-h-[320px] bg-neutral-50 relative">
                {editWarehouse.latitude && editWarehouse.longitude && !Number.isNaN(Number(editWarehouse.latitude)) && !Number.isNaN(Number(editWarehouse.longitude)) ? (
                  <SellerServiceMap
                    latitude={Number(editWarehouse.latitude)}
                    longitude={Number(editWarehouse.longitude)}
                    radiusKm={Number(editWarehouse.serviceRadiusKm) || 50}
                    storeName={editWarehouse.warehouseName}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-sm text-neutral-500">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-neutral-300">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <p className="font-medium text-neutral-700">No Location Preview</p>
                    <p className="text-xs text-neutral-500 mt-1">Please fill/search for coordinates to see the radius circle on map</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
