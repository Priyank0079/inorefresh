import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink, Wallet, Package, TrendingDown } from 'lucide-react';
import api from '../../../services/api/config';
import toast from 'react-hot-toast';

export default function AdminRefundApproval() {
  const [stuckReturns, setStuckReturns] = useState<any[]>([]);
  const [negativeWarehouses, setNegativeWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stuck' | 'negative'>('stuck');

  useEffect(() => {
    fetchExceptions();
  }, []);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/returns/workflow/admin/refund-exceptions');
      if (res.data.success) {
        setStuckReturns(res.data.data.stuckReturns || []);
        setNegativeWarehouses(res.data.data.negativeWarehouses || []);
      }
    } catch (error) {
      toast.error('Failed to load refund exceptions');
    } finally {
      setLoading(false);
    }
  };

  const stuckCount = stuckReturns.length;
  const negativeCount = negativeWarehouses.length;
  const totalNegativeDebt = negativeWarehouses.reduce((sum, w) => sum + Math.abs(w.balance || 0), 0);

  const getStuckHours = (since: string) => {
    const diff = Date.now() - new Date(since).getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refund Exceptions Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Auto-refunds run on OTP verification. This dashboard shows only <strong>failed/stuck</strong> cases that need manual attention.
          </p>
        </div>
        <button
          onClick={fetchExceptions}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0">ℹ️</div>
        <div className="text-sm text-blue-800">
          <strong>How auto-refund works:</strong> When a rider verifies the OTP at the warehouse, the system <em>atomically</em> deducts the refund amount from the warehouse wallet and credits the retailer's Inor Wallet in a single MongoDB transaction. If successful, the return status becomes <strong>REFUNDED</strong> automatically — no admin action needed.
          <br /><span className="text-blue-600 font-semibold mt-1 block">Returns showing here are stuck and likely failed the auto-refund.</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-2xl border p-5 ${stuckCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'} shadow-sm`}>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-gray-600">Stuck Returns</p>
          </div>
          <p className={`text-3xl font-bold mt-1 ${stuckCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{stuckCount}</p>
          <p className="text-xs text-gray-500 mt-1">In transit &gt; 2 hours</p>
        </div>
        <div className={`rounded-2xl border p-5 ${negativeCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100'} shadow-sm`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <p className="text-sm text-gray-600">Negative Warehouses</p>
          </div>
          <p className={`text-3xl font-bold mt-1 ${negativeCount > 0 ? 'text-rose-600' : 'text-gray-400'}`}>{negativeCount}</p>
          <p className="text-xs text-gray-500 mt-1">Wallets below zero</p>
        </div>
        <div className={`rounded-2xl border p-5 ${totalNegativeDebt > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100'} shadow-sm`}>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-rose-600" />
            <p className="text-sm text-gray-600">Total Outstanding Debt</p>
          </div>
          <p className={`text-3xl font-bold mt-1 ${totalNegativeDebt > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
            ₹{totalNegativeDebt.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-500 mt-1">Across all negative warehouses</p>
        </div>
      </div>

      {/* All Clear */}
      {!loading && stuckCount === 0 && negativeCount === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-bold text-emerald-800">All Clear!</h3>
          <p className="text-emerald-600 text-sm mt-1">No stuck returns or negative-balance warehouses. Auto-refunds are running smoothly.</p>
        </div>
      )}

      {/* Tabs */}
      {(stuckCount > 0 || negativeCount > 0) && (
        <>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('stuck')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'stuck' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Stuck Returns {stuckCount > 0 && <span className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{stuckCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab('negative')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'negative' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Negative Balances {negativeCount > 0 && <span className="ml-1 bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full">{negativeCount}</span>}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading exceptions...</div>
          ) : (
            <>
              {/* Stuck Returns Table */}
              {activeTab === 'stuck' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {stuckReturns.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">No stuck returns.</div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-amber-50 text-amber-800 font-semibold border-b border-amber-100">
                        <tr>
                          <th className="px-6 py-4">Return ID</th>
                          <th className="px-6 py-4">Product</th>
                          <th className="px-6 py-4">Retailer</th>
                          <th className="px-6 py-4">Warehouse</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Est. Refund</th>
                          <th className="px-6 py-4">Stuck For</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {stuckReturns.map((ret) => {
                          const hrs = getStuckHours(ret.stuckSince);
                          return (
                            <tr key={ret.id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 font-mono text-xs text-gray-600">#{ret.id?.slice(-8).toUpperCase()}</td>
                              <td className="px-6 py-4 font-medium text-gray-900 max-w-[140px] truncate">{ret.productName}</td>
                              <td className="px-6 py-4 text-gray-700">{ret.shopName || '—'}</td>
                              <td className="px-6 py-4 text-gray-700">{ret.warehouseName || '—'}</td>
                              <td className="px-6 py-4">
                                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-semibold">{ret.status}</span>
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-800">₹{(ret.refundAmount || 0).toLocaleString('en-IN')}</td>
                              <td className="px-6 py-4">
                                <span className={`text-xs font-bold ${hrs >= 6 ? 'text-rose-600' : 'text-amber-600'}`}>
                                  {hrs}h ago
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Negative Balance Warehouses */}
              {activeTab === 'negative' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {negativeWarehouses.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">No negative balance warehouses.</div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-rose-50 text-rose-800 font-semibold border-b border-rose-100">
                        <tr>
                          <th className="px-6 py-4">Warehouse</th>
                          <th className="px-6 py-4">Manager</th>
                          <th className="px-6 py-4">Mobile</th>
                          <th className="px-6 py-4 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {negativeWarehouses.map((wh) => (
                          <tr key={wh.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-bold text-gray-900">{wh.warehouseName}</td>
                            <td className="px-6 py-4 text-gray-700">{wh.managerName}</td>
                            <td className="px-6 py-4 text-gray-600 font-mono">{wh.mobile}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-rose-600 font-black text-base">
                                - ₹{Math.abs(wh.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
