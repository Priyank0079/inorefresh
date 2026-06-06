import { useState, useEffect } from "react";
import {
  getCashCollections,
  createCashCollection,
  type CashCollection,
  type CreateCashCollectionData,
} from "../../../services/api/admin/adminDeliveryService";
import { getDeliveryBoys } from "../../../services/api/admin/adminDeliveryService";
import { useAuth } from "../../../context/AuthContext";

export default function AdminCashCollection() {
  const { isAuthenticated, token } = useAuth();
  const [cashCollections, setCashCollections] = useState<CashCollection[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newCollectionData, setNewCollectionData] = useState<CreateCashCollectionData>({
    deliveryBoyId: "",
    orderId: "",
    amount: 0,
    remark: "",
  });

  // Fetch delivery boys and cash collections on component mount
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch delivery boys for the dropdown
        const deliveryBoysResponse = await getDeliveryBoys({
          status: "Active",
          limit: 100,
        });
        if (deliveryBoysResponse.success) {
          setDeliveryBoys(deliveryBoysResponse.data);
        }

        // Fetch cash collections
        const params: any = {
          page: currentPage,
          limit: entriesPerPage,
        };

        if (selectedDeliveryBoy !== "all") {
          params.deliveryBoyId = selectedDeliveryBoy;
        }

        if (fromDate) {
          params.fromDate = fromDate;
        }

        if (toDate) {
          params.toDate = toDate;
        }

        if (searchTerm) {
          params.search = searchTerm;
        }

        const cashResponse = await getCashCollections(params);

        if (cashResponse.success) {
          setCashCollections(cashResponse.data);
        } else {
          setError("Failed to load cash collections");
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(
          err.response?.data?.message ||
          "Failed to load data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    isAuthenticated,
    token,
    currentPage,
    entriesPerPage,
    selectedDeliveryBoy,
    fromDate,
    toDate,
    searchTerm,
    refreshKey,
  ]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Note: Filtering is done server-side, so we just use the cashCollections as is
  const displayedCollections = cashCollections;

  // For pagination display (simplified - in real app, this would come from API)
  const totalPages = Math.ceil(displayedCollections.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleAddCollection = () => {
    setShowAddModal(true);
    setAddError(null);
    setNewCollectionData({
      deliveryBoyId: "",
      orderId: "",
      amount: 0,
      remark: "",
    });
  };

  const handleSubmitCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionData.deliveryBoyId || !newCollectionData.orderId || newCollectionData.amount <= 0) {
      setAddError("Please fill out all required fields correctly.");
      return;
    }

    try {
      setSubmitting(true);
      setAddError(null);
      const response = await createCashCollection(newCollectionData);
      
      if (response.success) {
        setSuccessMessage("Cash collection added successfully.");
        setShowAddModal(false);
        setRefreshKey((prev) => prev + 1);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setAddError("Failed to add cash collection.");
      }
    } catch (err: any) {
      console.error("Error creating cash collection:", err);
      setAddError(err.response?.data?.message || "Failed to create cash collection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Delivery Boy",
      "Order ID",
      "Total",
      "Amount Collected",
      "Remark",
      "Date",
    ];
    const csvContent = [
      headers.join(","),
      ...cashCollections.map((collection) =>
        [
          collection._id.slice(-6),
          `"${collection.deliveryBoyName}"`,
          collection.orderId,
          collection.total.toFixed(2),
          collection.amount.toFixed(2),
          `"${collection.remark || ""}"`,
          new Date(collection.collectedAt).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `cash_collections_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearDate = () => {
    setFromDate("");
    setToDate("");
  };

  const methods = ["All", "Cash", "Card", "Online"];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#12b2a2] to-[#0d9488] px-4 sm:px-6 py-4 rounded-t-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 shadow-sm">
        <h1 className="text-white text-xl sm:text-2xl font-semibold">
          Delivery Boy Cash Collection List
        </h1>
        <button 
          onClick={handleAddCollection}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors backdrop-blur-sm">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Cash Collection
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        {/* Filters — compact two-row toolbar */}
        <div className="px-4 py-3 border-b border-neutral-200 space-y-2">

          {/* Row 1: Date range + Delivery Boy + Method */}
          <div className="flex flex-wrap items-center gap-3">

            {/* Date range */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500 whitespace-nowrap">From:</span>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] w-[130px]"
              />
              <span className="text-neutral-400 text-xs">–</span>
              <span className="text-xs text-neutral-500 whitespace-nowrap">To:</span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] w-[130px]"
              />
              <button
                onClick={handleClearDate}
                className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-800 text-white rounded text-xs transition-colors whitespace-nowrap">
                Clear
              </button>
            </div>

            <div className="h-5 w-px bg-neutral-200 hidden sm:block" />

            {/* Delivery Boy */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500 whitespace-nowrap">Delivery Boy:</span>
              <select
                value={selectedDeliveryBoy}
                onChange={(e) => { setSelectedDeliveryBoy(e.target.value); setCurrentPage(1); }}
                className="px-2 py-1.5 border border-neutral-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] min-w-[140px]">
                <option value="all">All Delivery Boys</option>
                {deliveryBoys.map((boy) => (
                  <option key={boy._id} value={boy._id}>{boy.name}</option>
                ))}
              </select>
            </div>

            {/* Method */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500 whitespace-nowrap">Method:</span>
              <select
                value={selectedMethod}
                onChange={(e) => { setSelectedMethod(e.target.value); setCurrentPage(1); }}
                className="px-2 py-1.5 border border-neutral-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] min-w-[90px]">
                {methods.map((method) => (
                  <option key={method} value={method === "All" ? "all" : method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Per Page + Export + Search — right-aligned */}
          <div className="flex flex-wrap items-center justify-end gap-3">

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500">Per Page:</span>
              <select
                value={entriesPerPage}
                onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1.5 border border-neutral-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2]">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              className="bg-[#12b2a2] hover:bg-[#0e8f82] text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500">Search:</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search…"
                className="px-2.5 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] w-[160px]"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                {[
                  { label: 'ID',        key: 'id' },
                  { label: 'Name',      key: 'name' },
                  { label: 'Order ID',  key: 'orderId' },
                  { label: 'Total',     key: 'total' },
                  { label: 'Amount',    key: 'amount' },
                  { label: 'Remark',    key: 'remark' },
                  { label: 'Date Time', key: 'dateTime' },
                ].map(({ label, key }) => (
                  <th
                    key={key}
                    className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 whitespace-nowrap"
                    onClick={() => handleSort(key)}>
                    <div className="flex items-center gap-1.5">
                      {label}
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="text-neutral-400 shrink-0">
                        <path d="M7 10L12 5L17 10M7 14L12 19L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 sm:px-4 py-8 text-center text-sm text-neutral-400">
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-3 sm:px-4 py-8 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : displayedCollections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 sm:px-4 py-8 text-center text-sm text-neutral-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                displayedCollections.map((collection, idx) => (
                  <tr key={collection._id} className={idx % 2 === 0 ? 'bg-white hover:bg-neutral-50' : 'bg-neutral-50/50 hover:bg-neutral-100/60'}>
                    <td className="px-3 sm:px-4 py-2.5 text-xs text-neutral-500 font-mono">
                      #{collection._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-sm text-neutral-900 font-medium whitespace-nowrap">
                      {collection.deliveryBoyName}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-xs text-neutral-500 font-mono max-w-[120px] truncate" title={collection.orderId}>
                      {collection.orderId}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-sm text-neutral-900">
                      ₹{collection.total.toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-sm font-semibold text-[#0d9488]">
                      ₹{collection.amount.toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-xs text-neutral-600 max-w-[150px] truncate" title={collection.remark || ''}>
                      {collection.remark || <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-xs text-neutral-600 whitespace-nowrap">
                      {new Date(collection.collectedAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-neutral-500">
            Showing {cashCollections.length === 0 ? 0 : startIndex + 1}–{Math.min(endIndex, cashCollections.length)} of {cashCollections.length} entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || totalPages === 0}
              className={`p-1.5 border rounded text-xs ${currentPage === 1 || totalPages === 0 ? 'border-neutral-200 text-neutral-300 cursor-not-allowed' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'}`}
              aria-label="Previous page">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-xs text-neutral-600 px-1">Page {currentPage}{totalPages > 0 ? ` / ${totalPages}` : ''}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`p-1.5 border rounded text-xs ${currentPage === totalPages || totalPages === 0 ? 'border-neutral-200 text-neutral-300 cursor-not-allowed' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'}`}
              aria-label="Next page">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white text-neutral-500 text-center text-sm py-4 border-t border-neutral-200">
        Copyright © 2026. Developed By{" "}
        <a href="#" className="text-[#12b2a2] hover:text-[#0e8f82]">
          Inor fresh
        </a>
      </div>

      {/* Success Message Banner */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded shadow-lg flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Add Cash Collection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !submitting && setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#12b2a2] to-[#0d9488] px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">Add Cash Collection</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
                className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitCollection} className="p-6 space-y-4">
              {addError && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded border border-red-200">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Delivery Boy <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={newCollectionData.deliveryBoyId}
                  onChange={(e) => setNewCollectionData({ ...newCollectionData, deliveryBoyId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] text-sm bg-white"
                >
                  <option value="" disabled>Select Delivery Boy</option>
                  {deliveryBoys.map((boy) => (
                    <option key={boy._id} value={boy._id}>{boy.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Order ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Order ID"
                  value={newCollectionData.orderId}
                  onChange={(e) => setNewCollectionData({ ...newCollectionData, orderId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Amount Collected (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={newCollectionData.amount || ""}
                  onChange={(e) => setNewCollectionData({ ...newCollectionData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Remark (Optional)
                </label>
                <textarea
                  placeholder="Add a remark..."
                  rows={3}
                  value={newCollectionData.remark || ""}
                  onChange={(e) => setNewCollectionData({ ...newCollectionData, remark: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] text-sm resize-none"
                ></textarea>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#12b2a2] hover:bg-[#0e8f82] text-white rounded text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Collection"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
