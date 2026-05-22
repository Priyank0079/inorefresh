import { useState, useEffect, useRef } from 'react';
import SellerServiceMap from '../components/SellerServiceMap';
import {
    getAllWarehouses,
    deleteWarehouse as deleteWarehouseApi,
    updateWarehouseByAdmin,
    Warehouse as WarehouseType,
} from '../../../services/api/warehouseService';
import {
    getWarehouseInwardStockSummary,
    WarehouseInwardStockSummary,
    InwardStockData,
} from '../../../services/api/adminWarehouseService';

interface Warehouse {
    _id: string;
    warehouseName: string;
    managerName: string;
    mobile: string;
    email: string;
    storeName: string;
    address: string;
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
    balance: number;
    serviceRadiusKm?: number;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    inwardStockSummary?: WarehouseInwardStockSummary;
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

const mapWarehouseToFrontend = (warehouse: WarehouseType): Warehouse => {
    return {
        _id: warehouse._id,
        warehouseName: warehouse.warehouseName,
        managerName: warehouse.managerName,
        mobile: warehouse.mobile,
        email: warehouse.email,
        storeName: warehouse.storeName,
        address: warehouse.address,
        status: warehouse.status,
        balance: warehouse.balance || 0,
        serviceRadiusKm: warehouse.serviceRadiusKm || 10,
        location: warehouse.location,
        inwardStockSummary: warehouse.inwardStockSummary,
    };
};

const isSystemDummyWarehouse = (warehouse: WarehouseType): boolean => {
    const email = (warehouse.email || '').toLowerCase();
    const name = (warehouse.warehouseName || '').toLowerCase();
    return email === 'admin-warehouse@zetomart.com' || name === 'Inor Fresh admin warehouse';
};

const isMockWarehouse = (warehouse: WarehouseType): boolean => {
    const name = warehouse.warehouseName || '';
    const manager = warehouse.managerName || '';
    const email = warehouse.email || '';
    const mobile = warehouse.mobile || '';
    const address = warehouse.address || '';
    return (
        /^Warehouse W\d+$/i.test(name) ||
        /^Manager W\d+$/i.test(manager) ||
        /^manager@w\d+\.com$/i.test(email) ||
        /^999999990\d$/.test(mobile) ||
        /Hub Address,\s*City/i.test(address)
    );
};

export default function AdminManageWarehouseList() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteWarehouse, setConfirmDeleteWarehouse] = useState<{ id: string; name: string } | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [editWarehouse, setEditWarehouse] = useState<EditWarehouseState | null>(null);
    const hasFetchedRef = useRef(false);

    // Inward stock modal state
    const [inwardStockModalOpen, setInwardStockModalOpen] = useState(false);
    const [selectedWarehouseForStock, setSelectedWarehouseForStock] = useState<Warehouse | null>(null);
    const [inwardStockData, setInwardStockData] = useState<InwardStockData[]>([]);
    const [inwardStockSummary, setInwardStockSummary] = useState<WarehouseInwardStockSummary | null>(null);
    const [inwardStockLoading, setInwardStockLoading] = useState(false);

    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        const fetchWarehouses = async () => {
            try {
                setLoading(true);
                const response = await getAllWarehouses();
                if (response.success && response.data) {
                    const realWarehouses = response.data.filter((w) => !isSystemDummyWarehouse(w) && !isMockWarehouse(w));
                    setWarehouses(realWarehouses.map(mapWarehouseToFrontend));
                } else {
                    setError('Failed to fetch warehouses');
                }
            } catch (err: any) {
                console.error('Error fetching warehouses:', err);
                if (err?.message === 'Network Error') {
                    setError('Backend API is not running on http://localhost:5000. Start backend server and refresh.');
                } else {
                    setError(err.response?.data?.message || 'Failed to fetch warehouses.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchWarehouses();
    }, []);

    const handleDeleteWarehouse = (warehouseId: string, warehouseName: string) => {
        setConfirmDeleteWarehouse({ id: warehouseId, name: warehouseName });
    };

    const handleConfirmDeleteWarehouse = async () => {
        if (!confirmDeleteWarehouse) return;
        const { id: warehouseId } = confirmDeleteWarehouse;
        setConfirmDeleteWarehouse(null);
        try {
            setDeletingId(warehouseId);
            setError('');
            const response = await deleteWarehouseApi(warehouseId);
            if (!response?.success) {
                setError(response?.message || 'Failed to delete warehouse.');
                return;
            }
            setWarehouses((prev) => prev.filter((w) => w._id !== warehouseId));
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to delete warehouse.');
        } finally {
            setDeletingId(null);
        }
    };

    const openEditModal = (warehouse: Warehouse) => {
        const lat = warehouse.location?.coordinates?.[1];
        const lng = warehouse.location?.coordinates?.[0];
        setEditWarehouse({
            id: warehouse._id,
            warehouseName: warehouse.warehouseName,
            address: warehouse.address || '',
            locationQuery: warehouse.address || '',
            latitude: lat !== undefined ? String(lat) : '',
            longitude: lng !== undefined ? String(lng) : '',
            serviceRadiusKm: String(warehouse.serviceRadiusKm || 10),
        });
    };

    const openInwardStockModal = async (warehouse: Warehouse) => {
        setSelectedWarehouseForStock(warehouse);
        setInwardStockModalOpen(true);
        setInwardStockLoading(true);
        try {
            const response = await getWarehouseInwardStockSummary(warehouse._id);
            if (response.success) {
                setInwardStockData(response.data.stocks);
                setInwardStockSummary(response.data.summary);
                // Update warehouse with summary
                setWarehouses(prev => prev.map(w => 
                    w._id === warehouse._id 
                        ? { ...w, inwardStockSummary: response.data.summary }
                        : w
                ));
            } else {
                setError('Failed to load inward stock data');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error loading inward stock data');
        } finally {
            setInwardStockLoading(false);
        }
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

            const updated = mapWarehouseToFrontend(response.data);
            setWarehouses((prev) => prev.map((w) => (w._id === updated._id ? updated : w)));
            setEditWarehouse(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to update warehouse details.');
        } finally {
            setSavingEdit(false);
        }
    };

    const filteredWarehouses = warehouses.filter((w) =>
        w.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.mobile.includes(searchTerm) ||
        w.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const previewLat = editWarehouse ? Number(editWarehouse.latitude) : NaN;
    const previewLng = editWarehouse ? Number(editWarehouse.longitude) : NaN;
    const previewRadius = editWarehouse ? Number(editWarehouse.serviceRadiusKm) : NaN;
    const showPreview = !Number.isNaN(previewLat) && !Number.isNaN(previewLng) && !Number.isNaN(previewRadius);

    return (
        <>
            <div className="flex flex-col h-full bg-gray-50 p-6">
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
                    <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Warehouse List</h2>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 italic border-l-4 border-red-500">{error}</div>
                    )}

                    <div className="p-4 border-b border-neutral-200">
                        <input
                            type="text"
                            className="w-full sm:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            placeholder="Search warehouses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-neutral-50 text-xs font-bold uppercase text-neutral-600 border-b">
                                    <th className="p-4">Warehouse Name</th>
                                    <th className="p-4">Manager</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4">Balance</th>
                                    <th className="p-4">Inward Stock</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-neutral-500">Loading...</td>
                                    </tr>
                                ) : filteredWarehouses.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-neutral-500">No warehouses found.</td>
                                    </tr>
                                ) : (
                                    filteredWarehouses.map((w) => (
                                        <tr key={w._id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-teal-900">{w.warehouseName}</div>
                                                <div className="text-xs text-neutral-500 truncate max-w-xs">{w.address}</div>
                                            </td>
                                            <td className="p-4">{w.managerName}</td>
                                            <td className="p-4 text-sm">
                                                <div>{w.mobile}</div>
                                                <div className="text-neutral-500">{w.email}</div>
                                            </td>
                                            <td className="p-4 font-semibold text-teal-700">INR {w.balance.toFixed(2)}</td>
                                            <td className="p-4">
                                                <button
                                                    type="button"
                                                    onClick={() => openInwardStockModal(w)}
                                                    className="inline-flex items-center gap-2 rounded bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                                    </svg>
                                                    {w.inwardStockSummary?.totalQuantity || 0} units
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        w.status === 'ACTIVE' ? 'bg-teal-50 text-[#12b2a2]' : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {w.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(w)}
                                                        className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteWarehouse(w._id, w.warehouseName)}
                                                        disabled={deletingId === w._id}
                                                        className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {deletingId === w._id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {editWarehouse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-3">
                            <h3 className="text-lg font-semibold">Edit Warehouse Location: {editWarehouse.warehouseName}</h3>
                            <button
                                type="button"
                                className="rounded px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
                                onClick={() => setEditWarehouse(null)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid gap-4 p-5 md:grid-cols-2">
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-neutral-700">Address</label>
                                <input
                                    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                                    value={editWarehouse.address}
                                    onChange={(e) => setEditWarehouse((prev) => (prev ? { ...prev, address: e.target.value } : prev))}
                                />

                                <label className="block text-sm font-medium text-neutral-700">Search Location</label>
                                <div className="flex gap-2">
                                    <input
                                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="e.g. Silicon City, Indore"
                                        value={editWarehouse.locationQuery}
                                        onChange={(e) => setEditWarehouse((prev) => (prev ? { ...prev, locationQuery: e.target.value } : prev))}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGeocodeLocation}
                                        disabled={geocoding}
                                        className="rounded bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                                    >
                                        {geocoding ? 'Finding...' : 'Find on Map'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-neutral-700">Latitude</label>
                                        <input
                                            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                                            value={editWarehouse.latitude}
                                            onChange={(e) => setEditWarehouse((prev) => (prev ? { ...prev, latitude: e.target.value } : prev))}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-neutral-700">Longitude</label>
                                        <input
                                            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                                            value={editWarehouse.longitude}
                                            onChange={(e) => setEditWarehouse((prev) => (prev ? { ...prev, longitude: e.target.value } : prev))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-neutral-700">Service Radius (km)</label>
                                    <input
                                        type="number"
                                        min={0.1}
                                        max={100}
                                        step={0.1}
                                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                                        value={editWarehouse.serviceRadiusKm}
                                        onChange={(e) => setEditWarehouse((prev) => (prev ? { ...prev, serviceRadiusKm: e.target.value } : prev))}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSaveWarehouseDetails}
                                    disabled={savingEdit}
                                    className="rounded bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                                >
                                    {savingEdit ? 'Saving...' : 'Save Details'}
                                </button>
                            </div>

                            <div>
                                {showPreview ? (
                                    <SellerServiceMap
                                        latitude={previewLat}
                                        longitude={previewLng}
                                        radiusKm={previewRadius}
                                        storeName={editWarehouse.warehouseName}
                                    />
                                ) : (
                                    <div className="flex h-full min-h-[320px] items-center justify-center rounded border border-neutral-200 text-sm text-neutral-500">
                                        Set location coordinates to preview map circle.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {inwardStockModalOpen && selectedWarehouseForStock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b sticky top-0 bg-white px-5 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900">
                                    Inward Stock: {selectedWarehouseForStock.warehouseName}
                                </h3>
                                <p className="text-xs text-neutral-500 mt-1">{selectedWarehouseForStock.address}</p>
                            </div>
                            <button
                                type="button"
                                className="rounded px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
                                onClick={() => {
                                    setInwardStockModalOpen(false);
                                    setSelectedWarehouseForStock(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {inwardStockLoading ? (
                            <div className="p-8 text-center text-neutral-500">Loading inward stock data...</div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                {inwardStockSummary && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-neutral-50 border-b">
                                        <div className="bg-white rounded-lg p-4 border border-neutral-100">
                                            <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Total Quantity</div>
                                            <div className="text-2xl font-bold text-emerald-600">
                                                {inwardStockSummary.totalQuantity.toLocaleString()} <span className="text-sm">units</span>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 border border-neutral-100">
                                            <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Total Records</div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {inwardStockSummary.totalRecords}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 border border-neutral-100">
                                            <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Received</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {inwardStockSummary.byStatus.received}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 border border-neutral-100">
                                            <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Pending</div>
                                            <div className="text-2xl font-bold text-yellow-600">
                                                {inwardStockSummary.byStatus.pending}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stock Details Table */}
                                <div className="p-6">
                                    {inwardStockData.length === 0 ? (
                                        <div className="text-center py-8 text-neutral-500">
                                            No inward stock records found
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-neutral-50 border-b">
                                                        <th className="p-3 text-left font-semibold text-neutral-700">Invoice #</th>
                                                        <th className="p-3 text-left font-semibold text-neutral-700">Supplier</th>
                                                        <th className="p-3 text-left font-semibold text-neutral-700">Product / Variant</th>
                                                        <th className="p-3 text-center font-semibold text-neutral-700">Quantity</th>
                                                        <th className="p-3 text-left font-semibold text-neutral-700">Date</th>
                                                        <th className="p-3 text-left font-semibold text-neutral-700">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {inwardStockData.map((stock) => (
                                                        <tr key={stock._id} className="hover:bg-neutral-50">
                                                            <td className="p-3 font-mono text-xs text-neutral-600">
                                                                {stock.invoiceNumber || 'N/A'}
                                                            </td>
                                                            <td className="p-3">{stock.supplierName}</td>
                                                            <td className="p-3">
                                                                <div className="font-medium text-neutral-900">{stock.productName}</div>
                                                                <div className="text-xs text-neutral-500">{stock.variant}</div>
                                                            </td>
                                                            <td className="p-3 text-center font-semibold text-emerald-600">
                                                                {stock.quantity}
                                                            </td>
                                                            <td className="p-3 text-xs text-neutral-600">
                                                                {new Date(stock.date).toLocaleDateString()}
                                                            </td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                                    stock.status === 'Received' ? 'bg-green-100 text-green-700' :
                                                                    stock.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                    {stock.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Warehouse Confirmation Modal */}
            {confirmDeleteWarehouse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDeleteWarehouse(null)} />
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Delete Warehouse</h3>
                        <p className="text-sm text-neutral-500 mb-6">
                            Delete warehouse <span className="font-semibold">"{confirmDeleteWarehouse.name}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteWarehouse(null)}
                                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDeleteWarehouse}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
