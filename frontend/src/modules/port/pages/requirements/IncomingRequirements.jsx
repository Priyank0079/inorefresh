import React, { useState, useEffect, useCallback } from 'react';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import SendOfferModal from '../../components/modals/SendOfferModal';
import { getPortRequirements, updateRequirementStatus } from '@/services/api/portRequirementService';
import { usePortSocket } from '../../hooks/usePortSocket';
import { useRefresh } from '@/context/RefreshContext';

const IncomingRequirements = () => {
  const { registerRefresh, unregisterRefresh } = useRefresh();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmRejectId, setConfirmRejectId] = useState(null);
  const [viewingReq, setViewingReq] = useState(null);

  const fetchRequirements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPortRequirements({
        search: searchTerm,
        status: statusFilter === 'All' ? undefined : statusFilter
      });
      if (res.success) {
        setRequirements(res.data);
      }
    } catch (err) {
      console.error("Error fetching requirements:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  useEffect(() => {
    registerRefresh(fetchRequirements);
    return () => unregisterRefresh();
  }, [fetchRequirements, registerRefresh, unregisterRefresh]);

  // Socket notification handler
  usePortSocket((newReq) => {
    // Add new requirement to the top of the list if it matches filters
    setRequirements(prev => {
        // Avoid duplicates if socket and initial fetch overlap
        if (prev.some(r => r._id === newReq._id)) return prev;
        return [newReq, ...prev];
    });
    
    // Play a notification sound or show a toast if needed
    if (Notification.permission === "granted") {
      new Notification("New Requirement", {
        body: `New requirement for ${newReq.fishName} from ${newReq.warehouseId?.name || 'Warehouse'}`
      });
    }
  });

  const handleSendOffer = (req) => {
    setSelectedReq(req);
    setIsModalOpen(true);
  };

  const onOfferSent = async (reqId) => {
    // Update local state after offer is sent
    setRequirements(prev => prev.map(req => 
      req._id === reqId ? { ...req, status: 'Negotiating' } : req
    ));
    
    // Also update backend status
    try {
      await updateRequirementStatus(reqId, 'Negotiating');
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleReject = (reqId) => {
    setConfirmRejectId(reqId);
  };

  const handleConfirmReject = async () => {
    if (!confirmRejectId) return;
    try {
      const res = await updateRequirementStatus(confirmRejectId, 'Cancelled');
      if (res.success) {
        setRequirements(prev => prev.filter(req => req._id !== confirmRejectId));
      }
    } catch (err) {
      console.error("Error rejecting requirement:", err);
    } finally {
      setConfirmRejectId(null);
    }
  };

  const handleView = (req) => {
    setViewingReq(req);
  };

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Incoming Requirements" 
        subtitle="Manage and respond to real-time warehouse requests"
        actions={
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search fish, warehouse..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none w-full transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative z-50">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white border-slate-200 text-slate-600 hover:shadow-sm'}`}
              >
                <span className="material-icons-outlined text-lg">filter_list</span>
                <span className="hidden sm:inline">{statusFilter === 'All' ? 'Filters' : `Status: ${statusFilter}`}</span>
                <span className="sm:hidden">Filters</span>
              </button>

              {showFilters && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filter by Status</p>
                    </div>
                    {['All', 'Open', 'Pending', 'Negotiating', 'Expired'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                          statusFilter === status
                            ? 'bg-teal-50 text-teal-700 font-bold border-l-4 border-teal-600 pl-3'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {statusFilter === status && <span className="material-icons-outlined text-base">check</span>}
                          {status}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Requirement ID</th>
                <th className="px-6 py-4 font-bold">Req. Date</th>
                <th className="px-6 py-4 font-bold">Warehouse</th>
                <th className="px-6 py-4 font-bold">Fish Details</th>
                <th className="px-6 py-4 font-bold">Quantity</th>
                <th className="px-6 py-4 font-bold">Deadline</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-4"></div>
                      <p className="text-sm font-medium">Loading requirements...</p>
                    </div>
                  </td>
                </tr>
              ) : requirements.length > 0 ? requirements.map((req) => (
                <tr key={req._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-teal-600">{req.requirementId}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{new Date(req.createdAt).toISOString().split('T')[0]}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{req.warehouseId?.warehouseName || 'Warehouse'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      {req.warehouseId?.address || 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{req.fishName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{req.category}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{req.grade}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-semibold">{req.quantityRequired} {req.unit}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(req.deadline).toISOString().split('T')[0]}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {req.status === 'Open' || req.status === 'Pending' ? (
                        <button 
                          onClick={() => handleSendOffer(req)}
                          className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-teal-600/10"
                        >
                          Send Offer
                        </button>
                      ) : (
                        <button 
                          className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed opacity-0 group-hover:opacity-100"
                          disabled
                        >
                          Offered
                        </button>
                      )}
                      <button 
                        onClick={() => handleView(req)}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
                      >
                        <span className="material-icons-outlined text-lg">visibility</span>
                      </button>
                      <button 
                        onClick={() => handleReject(req._id)}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all"
                      >
                        <span className="material-icons-outlined text-lg">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-medium">
                    <span className="material-icons-outlined text-4xl block mb-2 opacity-20">inventory_2</span>
                    No requirements found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-sm text-slate-500">Showing {requirements.length} entries</p>
          <div className="flex items-center gap-1">
            <button className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled>
              <span className="material-icons-outlined">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-teal-600 text-white text-sm font-bold shadow-md shadow-teal-600/20">1</button>
            <button className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled>
              <span className="material-icons-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <SendOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        requirement={selectedReq}
        onOfferSent={onOfferSent}
      />

      {/* Inline Reject Confirmation Modal */}
      {confirmRejectId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmRejectId(null)} />
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons-outlined text-2xl">block</span>
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-1">Reject Requirement?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">This action will mark the requirement as cancelled.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRejectId(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                Yes, Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline View Details Modal */}
      {viewingReq && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setViewingReq(null)} />
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">Requirement Details</h3>
              <button onClick={() => setViewingReq(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <span className="material-icons-outlined text-xl">close</span>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Requirement ID</span>
                <span className="font-bold text-teal-600">{viewingReq.requirementId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Fish Name</span>
                <span className="font-semibold text-slate-800">{viewingReq.fishName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Warehouse</span>
                <span className="font-semibold text-slate-800">{viewingReq.warehouseId?.warehouseName || viewingReq.warehouseId?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Quantity</span>
                <span className="font-semibold text-slate-800">{viewingReq.quantityRequired} {viewingReq.unit}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Target Price</span>
                <span className="font-bold text-slate-800">₹{viewingReq.targetPrice}/kg</span>
              </div>
            </div>
            <button
              onClick={() => setViewingReq(null)}
              className="w-full mt-5 py-2.5 rounded-xl font-semibold text-sm bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomingRequirements;
