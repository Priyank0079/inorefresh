import { useState, useEffect } from 'react';
import { getFundTransfers, addFundTransfer, getDeliveryBoys, DeliveryBoy, FundTransfer } from '../../../services/api/admin/adminDeliveryService';

export default function AdminFundTransfer() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [fundTransfers, setFundTransfers] = useState<FundTransfer[]>([]);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [deliveryBoysList, setDeliveryBoysList] = useState<DeliveryBoy[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    deliveryBoyId: '',
    amount: '',
    type: 'Credit',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDeliveryBoys = async () => {
    try {
      const response = await getDeliveryBoys({ limit: 1000 });
      if (response.success && response.data) {
        setDeliveryBoysList(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch delivery boys', err);
    }
  };

  const fetchFundTransfers = async () => {
    setLoading(true);
    try {
      const response = await getFundTransfers({
        page: currentPage,
        limit: entriesPerPage,
        deliveryBoyId: selectedDeliveryBoy === 'all' ? undefined : selectedDeliveryBoy,
        type: selectedMethod === 'all' ? undefined : selectedMethod,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: searchTerm || undefined
      });
      
      if (response.success && response.data) {
        setFundTransfers(response.data);
        if (response.pagination) {
          setTotalTransfers(response.pagination.total);
        }
      }
    } catch (err) {
      console.error('Failed to fetch fund transfers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchFundTransfers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, entriesPerPage, selectedDeliveryBoy, selectedMethod, fromDate, toDate, searchTerm]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedTransfers = [...fundTransfers].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn as keyof FundTransfer];
    const bValue = b[sortColumn as keyof FundTransfer];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(totalTransfers / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Name', 'Mobile', 'Opening Balance', 'Closing Balance', 'Amount', 'Type', 'Message', 'Date'].join(','),
      ...sortedTransfers.map(t => [
        t.id,
        `"${t.name}"`,
        t.mobile,
        t.openingBalance,
        t.closingBalance,
        t.amount,
        t.type,
        `"${t.message}"`,
        new Date(t.date).toLocaleString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fund_transfers_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearDate = () => {
    setFromDate('');
    setToDate('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransfer.deliveryBoyId || !newTransfer.amount || !newTransfer.message) {
      setError('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const response = await addFundTransfer({
        deliveryBoyId: newTransfer.deliveryBoyId,
        amount: Number(newTransfer.amount),
        type: newTransfer.type as 'Credit' | 'Debit',
        message: newTransfer.message
      });
      
      if (response.success) {
        setIsModalOpen(false);
        setNewTransfer({
          deliveryBoyId: '',
          amount: '',
          type: 'Credit',
          message: ''
        });
        fetchFundTransfers();
      } else {
        setError(response.message || 'Failed to add fund transfer');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#12b2a2] to-[#0d9488] px-4 sm:px-6 py-4 rounded-t-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 shadow-sm">
        <h1 className="text-white text-xl sm:text-2xl font-semibold">View Fund Transfer</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors backdrop-blur-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Fund Transfer
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 sm:p-6 border-b border-neutral-200">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Left Side Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
              {/* From - To Date */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-700 whitespace-nowrap">From - To Date:</label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="pl-3 pr-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] min-w-[140px]"
                    />
                  </div>
                  <span className="text-neutral-500">-</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="pl-3 pr-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] min-w-[140px]"
                    />
                  </div>
                  <button
                    onClick={handleClearDate}
                    className="px-3 py-2 bg-neutral-700 hover:bg-neutral-800 text-white rounded text-sm transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Filter by Delivery Boy */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-700 whitespace-nowrap">Filter by Delivery Boy:</label>
                <select
                  value={selectedDeliveryBoy}
                  onChange={(e) => {
                    setSelectedDeliveryBoy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] min-w-[150px]"
                >
                  <option value="all">All Delivery Boy</option>
                  {deliveryBoysList.map((boy) => (
                    <option key={boy._id} value={boy._id}>
                      {boy.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Method */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-700 whitespace-nowrap">Filter by Method:</label>
                <select
                  value={selectedMethod}
                  onChange={(e) => {
                    setSelectedMethod(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] min-w-[100px]"
                >
                  <option value="all">All</option>
                  <option value="Credit">Credit</option>
                  <option value="Debit">Debit</option>
                </select>
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Per Page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-700">Per Page:</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="bg-[#12b2a2] hover:bg-[#0e8f82] text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export
              </button>

              {/* Search */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-700">Search:</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search..."
                  className="px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] min-w-[150px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#12b2a2] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <table className="w-full min-w-[1200px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th
                  className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-2">
                    ID
                  </div>
                </th>
                <th
                  className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name
                  </div>
                </th>
                <th
                  className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('mobile')}
                >
                  <div className="flex items-center gap-2">
                    Mobile
                  </div>
                </th>
                <th
                  className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('openingBalance')}
                >
                  <div className="flex items-center gap-2">
                    Opening Balance (₹)
                  </div>
                </th>
                <th
                  className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('closingBalance')}
                >
                  <div className="flex items-center gap-2">
                    Closing Balance (₹)
                  </div>
                </th>
                <th
                  className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-2">
                    amount (₹)
                  </div>
                </th>
                <th
                  className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-2">
                    Type
                  </div>
                </th>
                <th
                  className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('message')}
                >
                  <div className="flex items-center gap-2">
                    Message
                  </div>
                </th>
                <th
                  className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Date
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {sortedTransfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 sm:px-6 py-8 text-center text-sm text-neutral-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                sortedTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-neutral-50">
                    <td className="px-4 sm:px-6 py-3 text-sm text-neutral-900">{transfer.id.slice(-6).toUpperCase()}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-neutral-900 font-medium">{transfer.name}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-neutral-600">{transfer.mobile}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-neutral-900">₹{transfer.openingBalance?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-neutral-900">₹{transfer.closingBalance?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-neutral-900 font-medium">₹{transfer.amount?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 sm:px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transfer.type === 'Credit'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {transfer.type}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-neutral-600">{transfer.message}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-neutral-600">
                      {new Date(transfer.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="text-xs sm:text-sm text-neutral-700">
            Showing {totalTransfers === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + entriesPerPage, totalTransfers)} of {totalTransfers} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || totalPages === 0}
              className={`p-2 border border-neutral-300 rounded ${currentPage === 1 || totalPages === 0
                  ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                  : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              aria-label="Previous page"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`p-2 border border-neutral-300 rounded ${currentPage === totalPages || totalPages === 0
                  ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                  : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              aria-label="Next page"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Add Fund Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Add Fund Transfer</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded border border-red-200">
                  {error}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Delivery Boy *</label>
                <select
                  required
                  value={newTransfer.deliveryBoyId}
                  onChange={(e) => setNewTransfer({ ...newTransfer, deliveryBoyId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#12b2a2]"
                >
                  <option value="">Select Delivery Boy</option>
                  {deliveryBoysList.map((boy) => (
                    <option key={boy._id} value={boy._id}>
                      {boy.name} ({boy.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={newTransfer.amount}
                  onChange={(e) => setNewTransfer({ ...newTransfer, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#12b2a2]"
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Type *</label>
                <select
                  required
                  value={newTransfer.type}
                  onChange={(e) => setNewTransfer({ ...newTransfer, type: e.target.value as 'Credit' | 'Debit' })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#12b2a2]"
                >
                  <option value="Credit">Credit (Add Funds)</option>
                  <option value="Debit">Debit (Deduct Funds)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Message *</label>
                <textarea
                  required
                  value={newTransfer.message}
                  onChange={(e) => setNewTransfer({ ...newTransfer, message: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#12b2a2]"
                  placeholder="Enter reason for transfer"
                  rows={3}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#12b2a2] hover:bg-[#0e8f82] text-white rounded-md font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting && (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                    </svg>
                  )}
                  {submitting ? 'Processing...' : 'Submit Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-neutral-500 py-4">
        Copyright © 2026. Developed By{' '}
        <a href="#" className="text-[#12b2a2] hover:text-[#0e8f82]">
          Inor fresh
        </a>
      </div>
    </div>
  );
}
