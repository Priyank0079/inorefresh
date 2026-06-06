import { useState, useEffect, useCallback } from 'react';
import { getAllWarehousesInwardStock } from '../../../services/api/adminWarehouseService';
import { InwardStockData } from '../../../services/api/adminWarehouseService';

export default function AdminWarehouseInwardStock() {
    const [stocks, setStocks] = useState<InwardStockData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const fetchInwardStocks = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await getAllWarehousesInwardStock(
                currentPage,
                rowsPerPage,
                searchTerm,
                statusFilter !== 'All Status' ? statusFilter : undefined,
                fromDate || undefined,
                toDate || undefined
            );

            if (response.success) {
                setStocks(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.pages);
                    setTotalRecords(response.pagination.total);
                }
            } else {
                setError(response.message || 'Failed to fetch inward stocks');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error loading inward stocks');
        } finally {
            setLoading(false);
        }
    }, [currentPage, rowsPerPage, searchTerm, statusFilter, fromDate, toDate]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, fromDate, toDate]);

    useEffect(() => {
        fetchInwardStocks();
    }, [fetchInwardStocks]);

    const handleExport = () => {
        const csvContent = [
            ['Warehouse', 'Invoice #', 'Supplier', 'Product', 'Variant', 'Quantity', 'Date', 'Status'].join(','),
            ...stocks.map(stock => [
                stock.warehouse?.warehouseName || 'N/A',
                stock.invoiceNumber || 'N/A',
                stock.supplierName,
                stock.productName,
                stock.variant,
                stock.quantity,
                new Date(stock.date).toLocaleDateString(),
                stock.status
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `warehouse_inward_stock_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClearFilters = () => {
        setFromDate('');
        setToDate('');
        setStatusFilter('All Status');
        setSearchTerm('');
        setCurrentPage(1);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Received':
                return 'bg-green-100 text-green-700';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'Cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-neutral-50">
            {/* Header */}
            <div className="bg-teal-600 text-white border-b border-teal-700 px-4 sm:px-6 py-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Warehouse Inward Stock Report</h1>
                        <p className="text-teal-50 text-sm mt-1">View and manage incoming inventory from all warehouses</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="bg-white text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="px-4 sm:px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Records</div>
                    <p className="text-3xl font-bold text-teal-600 mt-2">{totalRecords.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Current Page</div>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stocks.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Quantity</div>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">
                        {stocks.reduce((sum, s) => sum + (s.quantity || 0), 0).toLocaleString()}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mx-4 sm:mx-6 mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                    {error}
                </div>
            )}

            {/* Content Card */}
            <div className="mx-4 sm:mx-6 mb-8 bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col">
                <div className="bg-teal-600 text-white px-6 py-3 rounded-t-lg">
                    <h2 className="text-lg font-semibold">Inward Stock Details</h2>
                </div>

                {/* Filter Bar */}
                <div className="p-6 border-b border-neutral-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option>All Status</option>
                                <option>Received</option>
                                <option>Pending</option>
                                <option>Cancelled</option>
                            </select>
                        </div>
                        <div className="flex flex-col justify-end mt-[18px]">
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="Search supplier, product, invoice..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg text-sm w-full lg:w-72 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-neutral-50 border-b">
                                <th className="p-4 text-left font-semibold text-neutral-700">Warehouse</th>
                                <th className="p-4 text-left font-semibold text-neutral-700">Invoice #</th>
                                <th className="p-4 text-left font-semibold text-neutral-700">Supplier</th>
                                <th className="p-4 text-left font-semibold text-neutral-700">Product / Variant</th>
                                <th className="p-4 text-center font-semibold text-neutral-700">Qty</th>
                                <th className="p-4 text-left font-semibold text-neutral-700">Date</th>
                                <th className="p-4 text-left font-semibold text-neutral-700">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-neutral-500">
                                        Loading inward stock records...
                                    </td>
                                </tr>
                            ) : stocks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-neutral-500">
                                        No inward stock records found.
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((stock) => (
                                    <tr key={stock._id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="p-4">
                                            <span className="font-medium text-teal-900">
                                                {stock.warehouse?.warehouseName || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-neutral-600">
                                            {stock.invoiceNumber || 'N/A'}
                                        </td>
                                        <td className="p-4 text-neutral-700">{stock.supplierName}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-neutral-900">{stock.productName}</div>
                                            <div className="text-xs text-neutral-500">{stock.variant}</div>
                                        </td>
                                        <td className="p-4 text-center font-semibold text-emerald-600">
                                            {stock.quantity}
                                        </td>
                                        <td className="p-4 text-xs text-neutral-600">
                                            {new Date(stock.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(stock.status)}`}>
                                                {stock.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 bg-neutral-50 rounded-b-lg border-t border-neutral-200 flex justify-between items-center text-sm text-neutral-600">
                    <div>
                        Showing <span className="font-semibold">{stocks.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</span> to{' '}
                        <span className="font-semibold">
                            {Math.min(currentPage * rowsPerPage, totalRecords)}
                        </span>{' '}
                        of <span className="font-semibold">{totalRecords}</span> records
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="px-3 py-1.5 rounded border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-2.5 py-1.5 rounded text-sm font-medium transition ${
                                        currentPage === page
                                            ? 'bg-teal-600 text-white'
                                            : 'border border-neutral-300 hover:bg-neutral-100'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="px-3 py-1.5 rounded border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
