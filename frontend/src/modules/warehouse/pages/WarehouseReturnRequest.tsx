import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReturnRequests, updateReturnStatus, ReturnRequest, GetReturnRequestsParams } from '../../../services/api/returnService';

export default function WarehouseReturnRequest() {
    const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [fromDate, setFromDate] = useState('12/06/2025');
    const [toDate, setToDate] = useState('12/06/2025');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [viewingRequest, setViewingRequest] = useState<ReturnRequest | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string>('');

    // Fetch return requests from API
    useEffect(() => {
        const fetchReturnRequests = async () => {
            setLoading(true);
            setError('');
            try {
                const params: GetReturnRequestsParams = {
                    page: currentPage,
                    limit: rowsPerPage,
                    sortBy: sortColumn || 'returnDate',
                    sortOrder: sortDirection,
                };

                // Parse date range
                if (fromDate && toDate && fromDate !== '12/06/2025') {
                    params.dateFrom = fromDate;
                    params.dateTo = toDate;
                }

                // Add status filter
                if (statusFilter !== 'All Status') {
                    params.status = statusFilter;
                }

                // Add search
                if (searchTerm) {
                    params.search = searchTerm;
                }

                const response = await getReturnRequests(params);
                if (response.success && response.data) {
                    setReturnRequests(response.data);
                } else {
                    setError(response.message || 'Failed to fetch return requests');
                }
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || 'Failed to fetch return requests');
            } finally {
                setLoading(false);
            }
        };

        fetchReturnRequests();
    }, [fromDate, toDate, statusFilter, searchTerm, currentPage, rowsPerPage, sortColumn, sortDirection]);

    // Client-side pagination (can be moved to backend later)
    const totalPages = Math.ceil(returnRequests.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const displayedRequests = returnRequests.slice(startIndex, endIndex);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ column }: { column: string }) => (
        <span className="text-neutral-300 text-[10px]">
            {sortColumn === column ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
        </span>
    );

    const handleClearDates = () => {
        setFromDate('');
        setToDate('');
    };

    const handleUpdateStatus = async (requestId: string, status: 'Approved' | 'Rejected') => {
        try {
            setUpdating(requestId);
            setError('');
            const response = await updateReturnStatus(requestId, { status });
            if (response.success) {
                setSuccessMessage(`Return request ${status.toLowerCase()} successfully`);
                setReturnRequests(requests => 
                    requests.map(req => req.id === requestId ? { ...req, status } : req)
                );
                if (viewingRequest && viewingRequest.id === requestId) {
                    setViewingRequest({ ...viewingRequest, status });
                }
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(response.message || 'Failed to update status');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-neutral-50">
            {/* Top Navigation/Header */}
            <div className="bg-[#12b2a2] text-white border-b border-teal-700 px-4 sm:px-6 py-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold">Return Request</h1>
                    <div className="flex items-center gap-2 text-sm">
                        <Link to="/Warehouse" className="text-teal-50 hover:text-white font-medium transition-colors">
                            Home
                        </Link>
                        <span className="text-teal-200">/</span>
                        <span className="text-white font-medium">Return Request</span>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 p-4 sm:p-6">
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col">
                    {/* Section Header - Green Banner */}
                    <div className="bg-[#12b2a2] text-white px-4 sm:px-6 py-3 rounded-t-lg">
                        <h2 className="text-lg sm:text-xl font-semibold">View Return Request</h2>
                    </div>

                    {successMessage && (
                        <div className="px-4 py-3 mx-4 mt-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
                            {successMessage}
                        </div>
                    )}

                    {/* Controls Panel */}
                    <div className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-neutral-100">
                        {/* Left Side: Date Range and Status Filter */}
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                            {/* Date Range Filter */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-neutral-600 whitespace-nowrap">From - To Date:</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={fromDate && toDate ? `${fromDate} - ${toDate}` : ''}
                                        placeholder="Select date range"
                                        className="pl-10 pr-3 py-2 bg-white border border-neutral-300 rounded text-sm focus:ring-1 focus:ring-[#12b2a2] focus:outline-none w-full sm:w-64"
                                        readOnly
                                    />
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                                    >
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </div>
                                <button
                                    onClick={handleClearDates}
                                    className="px-3 py-2 bg-neutral-700 hover:bg-neutral-800 text-white text-sm rounded transition-colors"
                                >
                                    Clear
                                </button>
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-neutral-600 whitespace-nowrap">Filter by Status:</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 bg-white border border-neutral-300 rounded text-sm focus:ring-1 focus:ring-[#12b2a2] focus:outline-none cursor-pointer"
                                >
                                    <option value="All Status">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        {/* Right Side: Per Page, Export, Search */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            {/* Per Page */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-neutral-600">Per Page:</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-white border border-neutral-300 rounded py-1.5 px-3 text-sm focus:ring-1 focus:ring-[#12b2a2] focus:outline-none cursor-pointer"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            {/* Export Button */}
                            <button
                                onClick={() => {
                                    const headers = ['Order Item Id', 'Shop Name', 'Product', 'Variant', 'Price', 'Disc Price', 'Quantity', 'Total', 'Status', 'Date'];
                                    const csvContent = [
                                        headers.join(','),
                                        ...returnRequests.map(request => [
                                            request.orderItemId,
                                            `"${request.shopName}"`,
                                            `"${request.productName || request.product}"`,
                                            `"${request.variant}"`,
                                            request.price,
                                            request.discPrice,
                                            request.quantity,
                                            request.total || request.amount,
                                            `"${request.status}"`,
                                            request.date
                                        ].join(','))
                                    ].join('\n');
                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement('a');
                                    const url = URL.createObjectURL(blob);
                                    link.setAttribute('href', url);
                                    link.setAttribute('download', `return_requests_${new Date().toISOString().split('T')[0]}.csv`);
                                    link.style.visibility = 'hidden';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="bg-[#12b2a2] hover:bg-[#0e7490] text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Export
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>

                            {/* Search */}
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">Search:</span>
                                <input
                                    type="text"
                                    className="pl-14 pr-3 py-1.5 bg-neutral-100 border-none rounded text-sm focus:ring-1 focus:ring-[#12b2a2] w-full sm:w-48"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>

                    {/* Loading and Error States */}
                    {loading && (
                        <div className="flex items-center justify-center p-8">
                            <div className="text-neutral-500">Loading return requests...</div>
                        </div>
                    )}
                    {error && !loading && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg m-4">
                            {error}
                        </div>
                    )}

                    {/* Table */}
                    {!loading && !error && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-neutral-200">
                                <thead>
                                    <tr className="bg-neutral-50 text-xs font-bold text-neutral-800">
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('orderItemId')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Order Item Id
                                                <SortIcon column="orderItemId" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('shopName')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Shop Name
                                                <SortIcon column="shopName" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('product')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Product
                                                <SortIcon column="product" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('variant')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Variant
                                                <SortIcon column="variant" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('price')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Price
                                                <SortIcon column="price" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('discPrice')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Disc Price
                                                <SortIcon column="discPrice" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('quantity')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Quantity
                                                <SortIcon column="quantity" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('total')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Total
                                                <SortIcon column="total" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('status')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Status
                                                <SortIcon column="status" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('date')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Date
                                                <SortIcon column="date" />
                                            </div>
                                        </th>
                                        <th className="p-4 border border-neutral-200">
                                            <div className="flex items-center gap-1">
                                                Action
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="p-8 text-center text-neutral-500">
                                                No data available in table
                                            </td>
                                        </tr>
                                    ) : (
                                        displayedRequests.map((request, index) => (
                                            <tr key={index} className="hover:bg-neutral-50">
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{request.orderItemId}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{request.shopName}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{request.productName || request.product}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{request.variant || 'N/A'}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">₹{(request.price || 0).toFixed(2)}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">₹{(request.discPrice || 0).toFixed(2)}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{request.quantity}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">₹{(request.total || request.amount || 0).toFixed(2)}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                                        request.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                        request.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{request.date}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">
                                                    <button
                                                        onClick={() => setViewingRequest(request)}
                                                        className="text-[#12b2a2] hover:text-[#0e7490] text-xs font-medium transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-neutral-600">
                            Showing {returnRequests.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, returnRequests.length)} of {returnRequests.length} entries
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || totalPages === 0}
                                className="w-8 h-8 flex items-center justify-center border border-green-300 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="w-8 h-8 flex items-center justify-center border border-green-300 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="px-4 sm:px-6 py-4 text-center bg-white border-t border-neutral-200">
                <p className="text-xs sm:text-sm text-neutral-600">
                    Copyright © 2026. Developed By{' '}
                    <span className="font-semibold text-teal-600">Inor fresh</span>
                </p>
            </footer>

            {/* Return Request Details Modal */}
            {viewingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewingRequest(null)} />
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-teal-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-base">Return Request Details</h3>
                            <button onClick={() => setViewingRequest(null)} className="text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-5 space-y-3 overflow-y-auto">
                            {[
                                { label: 'Order Item ID', value: viewingRequest.orderItemId },
                                { label: 'Product', value: viewingRequest.product },
                                { label: 'Variant', value: viewingRequest.variant },
                                { label: 'Price', value: `₹${viewingRequest.price.toFixed(2)}` },
                                { label: 'Quantity', value: String(viewingRequest.quantity) },
                                { label: 'Total', value: `₹${viewingRequest.total.toFixed(2)}` },
                                { label: 'Status', value: viewingRequest.status },
                                { label: 'Date', value: viewingRequest.date },
                                { label: 'Return Reason', value: viewingRequest.returnReason || 'N/A' },
                                { label: 'Description', value: viewingRequest.description || 'N/A' },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex flex-col sm:flex-row sm:justify-between items-start py-2 border-b border-neutral-100 last:border-0">
                                    <span className="text-sm font-medium text-neutral-500 w-40 flex-shrink-0">{label}</span>
                                    <span className="text-sm text-neutral-800 font-semibold sm:text-right mt-1 sm:mt-0">{value}</span>
                                </div>
                            ))}

                            {/* Images Section */}
                            {viewingRequest.images && viewingRequest.images.length > 0 && (
                                <div className="pt-2 border-t border-neutral-100">
                                    <span className="text-sm font-medium text-neutral-500 block mb-2">Attached Images</span>
                                    <div className="flex flex-wrap gap-3">
                                        {viewingRequest.images.map((img, idx) => (
                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block">
                                                <img 
                                                    src={img} 
                                                    alt={`Return item ${idx + 1}`} 
                                                    className="w-20 h-20 object-cover rounded-lg border border-neutral-200 hover:opacity-80 transition-opacity"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rider Pickup Evidence Section */}
                            {((viewingRequest.proofOfPickupEvidence && viewingRequest.proofOfPickupEvidence.length > 0) || viewingRequest.riderRemarks) && (
                                <div className="pt-4 border-t border-neutral-200 mt-2 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                                    <span className="text-sm font-bold text-amber-800 block mb-2 flex items-center gap-1.5">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Rider Pickup Verification
                                    </span>
                                    
                                    {viewingRequest.riderRemarks && (
                                        <div className="mb-3">
                                            <span className="text-xs font-semibold text-neutral-500 block">Rider Remarks:</span>
                                            <p className="text-xs text-neutral-700 italic bg-white p-2 rounded border border-neutral-100 mt-1 font-medium">{viewingRequest.riderRemarks}</p>
                                        </div>
                                    )}

                                    {viewingRequest.proofOfPickupEvidence && viewingRequest.proofOfPickupEvidence.length > 0 && (
                                        <div>
                                            <span className="text-xs font-semibold text-neutral-500 block mb-1.5">Rider Proof Photos:</span>
                                            <div className="flex flex-wrap gap-3">
                                                {viewingRequest.proofOfPickupEvidence.map((img, idx) => (
                                                    <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block relative group">
                                                        <img 
                                                            src={img} 
                                                            alt={`Rider pickup proof ${idx + 1}`} 
                                                            className="w-20 h-20 object-cover rounded-lg border border-amber-200 shadow-sm hover:ring-2 hover:ring-amber-500 hover:opacity-90 transition-all"
                                                        />
                                                        <span className="absolute bottom-1 right-1 bg-black/60 text-[9px] text-white px-1.5 py-0.5 rounded font-bold">#{idx + 1}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Transit Status / OTP Section */}
                            {viewingRequest.status === 'IN_TRANSIT_TO_WAREHOUSE' && (
                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                    {/* Rider on the way banner */}
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 mb-3 flex items-start gap-3">
                                        <div className="text-xl">🚛</div>
                                        <div>
                                            <p className="text-xs font-bold text-indigo-900">Rider is on the way!</p>
                                            <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                                                The rider has collected the return and is heading to your warehouse. Prepare to receive the goods.
                                            </p>
                                        </div>
                                    </div>

                                    {/* OTP Display */}
                                    {(viewingRequest as any).warehouseVerificationOtp && (
                                        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-center">
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Your Verification OTP</p>
                                            <p className="text-3xl font-black tracking-[0.4em] text-amber-900 my-2">
                                                {(viewingRequest as any).warehouseVerificationOtp}
                                            </p>
                                            <p className="text-[11px] text-amber-700 font-medium">
                                                Share this OTP with the rider to confirm you have received the returned goods.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Received at Warehouse Badge */}
                            {viewingRequest.status === 'RECEIVED_AT_WAREHOUSE' && (
                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-center gap-3">
                                        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-green-900">Return Received at Warehouse ✅</p>
                                            <p className="text-[11px] text-green-700 mt-0.5">OTP verified. Inventory has been updated.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Auto-Refunded: Wallet Debit Summary */}
                            {viewingRequest.status === 'REFUNDED' && (
                                <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2.5">
                                    {/* Debit Alert */}
                                    <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-xl">💸</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Wallet Deducted</p>
                                                <p className="text-2xl font-black text-rose-700 leading-tight">
                                                    - ₹{((viewingRequest as any).refundAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                                            This amount was automatically deducted from your wallet and credited to the retailer as a return refund.
                                            Check your <strong>Wallet</strong> page for the full transaction history.
                                        </p>
                                    </div>

                                    {/* Confirmation row */}
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                                        <span className="text-base">✅</span>
                                        <p className="text-[11px] text-emerald-800 font-semibold">Refund successfully credited to retailer's Inor Wallet.</p>
                                    </div>
                                </div>
                            )}

                        </div>
                        <div className="px-5 pb-5 pt-3 border-t border-neutral-100 shrink-0">
                            {(viewingRequest.status === 'Pending' || viewingRequest.status === 'REQUESTED') ? (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleUpdateStatus(viewingRequest.id || (viewingRequest as any)._id, 'Rejected')}
                                        disabled={updating === (viewingRequest.id || (viewingRequest as any)._id)}
                                        className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(viewingRequest.id || (viewingRequest as any)._id, 'Approved')}
                                        disabled={updating === (viewingRequest.id || (viewingRequest as any)._id)}
                                        className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                                    >
                                        {updating === (viewingRequest.id || (viewingRequest as any)._id) ? 'Processing...' : 'Approve'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setViewingRequest(null)}
                                    className="w-full py-2.5 rounded-xl font-semibold text-sm bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


