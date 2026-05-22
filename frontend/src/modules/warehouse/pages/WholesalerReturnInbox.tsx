import { useState, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import api from '../../../services/api/config';
import toast from 'react-hot-toast';

export default function WholesalerReturnInbox() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      // Fetching all returns with the new REQUESTED / UNDER_REVIEW statuses
      const res = await api.get('/returns?status=All Status');
      if (res.data.success) {
         setReturns(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'Approve' | 'Reject' | 'Escalate') => {
    if (!selectedReturn) return;
    
    let comment = '';
    if (action !== 'Approve') {
      const reason = window.prompt(`Please enter reason to ${action} this return:`);
      if (reason === null) return; // cancelled
      comment = reason;
    }

    try {
      const res = await api.post(`/returns/workflow/warehouse/review/${selectedReturn.id}`, { action, comment });
      if (res.data.success) {
        toast.success(`Return request ${action}d successfully`);
        setSelectedReturn(null);
        fetchReturns();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} return`);
    }
  };

  const filteredReturns = returns.filter(r => {
    if (filter === 'All') return true;
    if (filter === 'Pending Review') return r.status === 'REQUESTED' || r.status === 'Pending';
    return r.status === filter;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Return Requests Inbox</h1>
          <p className="text-gray-500">Review and manage retailer return requests.</p>
        </div>
        <div className="flex items-center gap-3">
           <select 
             value={filter}
             onChange={e => setFilter(e.target.value)}
             className="border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
           >
             <option value="All">All Requests</option>
             <option value="Pending Review">Pending Review</option>
             <option value="APPROVED">Approved</option>
             <option value="REJECTED">Rejected</option>
             <option value="UNDER_REVIEW">Escalated</option>
           </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading inbox...</div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Request ID</th>
                <th className="px-6 py-4">Retailer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Returned Qty</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReturns.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">#{req.id.slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4">{req.shopName}</td>
                  <td className="px-6 py-4">{req.productName}</td>
                  <td className="px-6 py-4 text-red-600 font-bold">{req.quantity}</td>
                  <td className="px-6 py-4">{req.returnReason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      req.status === 'REQUESTED' || req.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                      req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedReturn(req)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Review Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No return requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white/90 backdrop-blur">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review Return Request</h2>
                <p className="text-sm text-gray-500">#{selectedReturn.id.slice(-6).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setSelectedReturn(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                {selectedReturn.image && (
                  <img src={selectedReturn.image} alt="Product" className="w-20 h-20 object-cover rounded-lg" />
                )}
                <div>
                  <h3 className="font-bold text-gray-900">{selectedReturn.productName}</h3>
                  <p className="text-sm text-gray-600 mt-1">Retailer: <span className="font-medium text-gray-900">{selectedReturn.shopName}</span></p>
                  <p className="text-sm text-gray-600">Order: <span className="font-medium text-gray-900">{selectedReturn.orderId}</span></p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Returned Qty</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{selectedReturn.quantity}</p>
                </div>
                <div className="p-4 border rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Reason</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedReturn.returnReason}</p>
                </div>
              </div>
              
              {selectedReturn.reasonDescription && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Retailer Comments</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{selectedReturn.reasonDescription}</p>
                </div>
              )}

              {/* Mock Photo Gallery */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Photo Evidence</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                    <span className="text-xs text-gray-400">No photos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t bg-gray-50 flex gap-3 rounded-b-2xl">
              {(selectedReturn.status === 'REQUESTED' || selectedReturn.status === 'Pending') ? (
                <>
                  <button 
                    onClick={() => handleAction('Approve')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all"
                  >
                    <CheckCircle className="w-5 h-5" /> Approve Return
                  </button>
                  <button 
                    onClick={() => handleAction('Reject')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all"
                  >
                    <XCircle className="w-5 h-5" /> Reject
                  </button>
                  <button 
                    onClick={() => handleAction('Escalate')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 transition-all"
                  >
                    <AlertTriangle className="w-5 h-5" /> Escalate
                  </button>
                </>
              ) : (
                <div className="w-full text-center py-2 text-gray-500 font-medium">
                  This request has already been processed ({selectedReturn.status})
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
