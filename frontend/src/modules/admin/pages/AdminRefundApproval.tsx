import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Wallet, Package, ArrowUpRight, Eye, RefreshCw } from 'lucide-react';
import api from '../../../services/api/config';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  RECEIVED_AT_WAREHOUSE: 'bg-amber-100 text-amber-800',
  REFUND_PENDING: 'bg-orange-100 text-orange-800',
  REFUND_APPROVED: 'bg-blue-100 text-blue-800',
  REFUNDED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-cyan-100 text-cyan-800',
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  Pending: 'bg-gray-100 text-gray-700',
};

export default function AdminRefundApproval() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
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

  const handleRefundAction = async (action: 'Approve' | 'Reject') => {
    if (!selectedReturn) return;
    if (action === 'Approve' && (!refundAmount || Number(refundAmount) <= 0)) {
      return toast.error('Please enter a valid refund amount');
    }
    setProcessing(true);
    try {
      const res = await api.post(`/returns/workflow/admin/refund/${selectedReturn.id}`, {
        action,
        amount: action === 'Approve' ? Number(refundAmount) : 0,
      });
      if (res.data.success) {
        toast.success(action === 'Approve' ? 'Refund issued to customer wallet!' : 'Return rejected.');
        setSelectedReturn(null);
        setRefundAmount('');
        fetchReturns();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const pendingReturns = returns.filter(r =>
    ['RECEIVED_AT_WAREHOUSE', 'REFUND_PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(r.status)
  );
  const processedReturns = returns.filter(r =>
    ['REFUNDED', 'REJECTED', 'REFUND_APPROVED'].includes(r.status)
  );
  const displayList = activeTab === 'pending' ? pendingReturns : processedReturns;

  // Stats
  const totalRefunded = processedReturns
    .filter(r => r.status === 'REFUNDED')
    .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refund Approval Center</h1>
          <p className="text-gray-500 mt-1">Review warehouse-received returns and process wallet refunds.</p>
        </div>
        <button
          onClick={fetchReturns}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Awaiting Action</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{pendingReturns.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Total Refunded</p>
          <p className="text-3xl font-bold text-green-600 mt-1">₹{totalRefunded.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Processed</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{processedReturns.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending ({pendingReturns.length})
        </button>
        <button
          onClick={() => setActiveTab('processed')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'processed'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Processed ({processedReturns.length})
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading returns...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Return ID</th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Retailer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayList.map((req: any) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">
                    #{req.id?.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{req.orderId}</td>
                  <td className="px-6 py-4 text-gray-700">{req.shopName}</td>
                  <td className="px-6 py-4 text-gray-700 max-w-[150px] truncate">{req.productName}</td>
                  <td className="px-6 py-4 font-bold text-red-600">{req.quantity}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-700'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedReturn(req);
                        setRefundAmount('');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {displayList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                    No {activeTab === 'pending' ? 'pending' : 'processed'} returns.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Refund Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-mono mb-1">
                    RETURN #{selectedReturn.id?.slice(-8).toUpperCase()}
                  </p>
                  <h2 className="text-xl font-bold">Refund Decision</h2>
                </div>
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Return Info */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{selectedReturn.productName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Retailer: <span className="font-medium text-gray-700">{selectedReturn.shopName}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Order: <span className="font-medium text-gray-700">{selectedReturn.orderId}</span>
                  </p>
                  <div className="mt-2 flex gap-3">
                    <span className="text-sm text-gray-500">Returned Qty:</span>
                    <span className="font-bold text-red-600">{selectedReturn.quantity}</span>
                  </div>
                  <p className="text-sm mt-1">
                    Reason: <span className="font-medium text-gray-700">{selectedReturn.returnReason}</span>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Current Status</span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_COLORS[selectedReturn.status] || 'bg-gray-100 text-gray-700'}`}>
                  {selectedReturn.status}
                </span>
              </div>

              {/* Refund Amount — only for actionable statuses */}
              {['RECEIVED_AT_WAREHOUSE', 'REFUND_PENDING', 'APPROVED'].includes(selectedReturn.status) && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Refund Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={e => setRefundAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-lg font-bold"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Amount will be credited to the retailer's wallet balance immediately.
                  </p>
                </div>
              )}

              {/* Inventory note */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
                <Package className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Returned items are currently in <strong>quarantined stock</strong>. After approving the refund, you can reclassify them from the Inventory management panel.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-2 space-y-3">
              {['RECEIVED_AT_WAREHOUSE', 'REFUND_PENDING', 'APPROVED'].includes(selectedReturn.status) ? (
                <>
                  <button
                    onClick={() => handleRefundAction('Approve')}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-green-100 disabled:opacity-60 transition-all text-base"
                  >
                    <Wallet className="w-5 h-5" />
                    {processing ? 'Processing...' : 'Approve & Issue Wallet Refund'}
                  </button>
                  <button
                    onClick={() => handleRefundAction('Reject')}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 border-2 border-red-200 text-red-600 font-bold rounded-2xl hover:bg-red-50 disabled:opacity-60 transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Return
                  </button>
                </>
              ) : (
                <div className="text-center py-3 text-gray-500 font-medium">
                  This return has already been processed ({selectedReturn.status})
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
