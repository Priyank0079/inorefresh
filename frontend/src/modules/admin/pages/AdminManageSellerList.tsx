import { useState, useEffect } from 'react';
import { getAllWarehouses, Warehouse as WarehouseType } from '../../../services/api/warehouseService';

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
    location: {
        type: "Point";
        coordinates: [number, number];
    };
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
        location: warehouse.location
    };
};

export default function AdminManageWarehouseList() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                setLoading(true);
                const response = await getAllWarehouses();
                if (response.success && response.data) {
                    setWarehouses(response.data.map(mapWarehouseToFrontend));
                } else {
                    setError('Failed to fetch warehouses');
                }
            } catch (err: any) {
                console.error('Error fetching warehouses:', err);
                setError(err.response?.data?.message || 'Failed to fetch warehouses.');
            } finally {
                setLoading(false);
            }
        };

        fetchWarehouses();
    }, []);

    const filteredWarehouses = warehouses.filter(w =>
        w.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.mobile.includes(searchTerm) ||
        w.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-gray-50 p-6">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
                <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Warehouse List</h2>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 italic border-l-4 border-red-500">
                        {error}
                    </div>
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
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-neutral-500">Loading...</td>
                                </tr>
                            ) : filteredWarehouses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-neutral-500">No warehouses found.</td>
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
                                        <td className="p-4 font-semibold text-teal-700">₹{w.balance.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${w.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {w.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
