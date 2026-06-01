import { useEffect, useState } from 'react';
import { getReturnRequests, type ReturnRequest } from '../../../services/api/returnService';

export default function WarehouseRefunds() {
  const [refunds, setRefunds] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Fetch all returns, then keep only refunded ones (refund information).
        const res = await getReturnRequests({ status: 'All Status' } as any);
        if (res.success) {
          const refunded = (res.data || []).filter(
            (r) => r.status === 'REFUNDED' || (r.refundAmount && r.refundAmount > 0)
          );
          setRefunds(refunded);
        } else {
          setError(res.message || 'Failed to load refunds');
        }
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load refunds');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = refunds.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.orderId || '').toLowerCase().includes(q) ||
      (r.productName || '').toLowerCase().includes(q) ||
      (r.customerName || r.shopName || '').toLowerCase().includes(q)
    );
  });

  const totalRefunded = refunds.reduce((s, r) => s + (r.refundAmount || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-[#12b2a2] p-5 sm:p-6 rounded-lg shadow-sm text-white">
        <h1 className="text-xl sm:text-2xl font-bold">Refund Information</h1>
        <p className="text-sm text-teal-50 mt-1">All refunds issued to customers for returns</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Total Refunds</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{refunds.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Total Amount Refunded</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">₹{totalRefunded.toFixed(2)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-800">Refund History</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, product, or customer..."
            className="px-3 py-2 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] sm:w-72"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading refunds…</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No refunds found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Order ID</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 sm:px-6 py-3 text-center font-semibold">Qty</th>
                  <th className="px-4 sm:px-6 py-3 text-right font-semibold">Refund Amount</th>
                  <th className="px-4 sm:px-6 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 font-medium text-neutral-800">{r.orderId || '—'}</td>
                    <td className="px-4 sm:px-6 py-3 text-neutral-700">{r.productName}</td>
                    <td className="px-4 sm:px-6 py-3 text-neutral-700">{r.customerName || r.shopName || '—'}</td>
                    <td className="px-4 sm:px-6 py-3 text-center text-neutral-700">{r.quantity}</td>
                    <td className="px-4 sm:px-6 py-3 text-right font-bold text-teal-600">₹{(r.refundAmount || 0).toFixed(2)}</td>
                    <td className="px-4 sm:px-6 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-neutral-500">
                      {r.date ? new Date(r.date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
