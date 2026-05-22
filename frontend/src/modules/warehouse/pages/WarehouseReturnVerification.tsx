import { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../../../services/api/config';
import toast from 'react-hot-toast';

type VerifyStage = 'search' | 'verify' | 'done';

export default function WarehouseReturnVerification() {
  const [stage, setStage] = useState<VerifyStage>('search');
  const [logisticsCode, setLogisticsCode] = useState('');
  const [otp, setOtp] = useState('');
  const [returnData, setReturnData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recentVerified, setRecentVerified] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!logisticsCode.trim()) return toast.error('Please enter the Return Logistics Code');
    setLoading(true);
    try {
      // Search by logistics code
      const res = await api.get(`/returns?reverseLogisticsCode=${logisticsCode.trim()}`);
      const results = res.data.data;
      if (!results || results.length === 0) {
        toast.error('No return found with that code');
        return;
      }
      setReturnData(results[0]);
      setStage('verify');
    } catch (error) {
      toast.error('Failed to find return request');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 4) return toast.error('Please enter the 4-digit OTP');
    if (!returnData) return;
    setLoading(true);
    try {
      const res = await api.post(
        `/returns/workflow/warehouse/verify/${returnData.id}`,
        { otp }
      );
      if (res.data.success) {
        toast.success('OTP verified. Items received & inventory updated!');
        setRecentVerified(prev => [returnData, ...prev.slice(0, 4)]);
        setStage('done');
        // reset after delay
        setTimeout(() => {
          setStage('search');
          setLogisticsCode('');
          setOtp('');
          setReturnData(null);
        }, 4000);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Invalid OTP. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-red-600" />
          Warehouse Receipt Verification
        </h1>
        <p className="text-gray-500 mt-1">
          Scan or enter the Reverse Logistics Code from the rider to verify return receipt.
        </p>
      </div>

      {/* Stage: Search */}
      {stage === 'search' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-lg">Step 1 — Enter Return Code</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={logisticsCode}
              onChange={e => setLogisticsCode(e.target.value.toUpperCase())}
              placeholder="e.g. RET-1716190000000"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all"
            >
              {loading ? 'Searching...' : 'Find'}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            The Reverse Logistics Code is displayed on the rider's app after wholesaler approval.
          </p>
        </div>
      )}

      {/* Stage: OTP Verify */}
      {stage === 'verify' && returnData && (
        <div className="space-y-4">
          {/* Return Info Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-bold text-gray-900">{returnData.productName}</h3>
                  <span className="text-sm text-gray-500">#{logisticsCode}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Retailer: <span className="font-medium">{returnData.shopName}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Returned Qty: <span className="font-bold text-red-600">{returnData.quantity}</span>
                </p>
              </div>
            </div>
          </div>

          {/* OTP Input */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-gray-700" />
              Step 2 — Verify Rider OTP
            </h2>
            <p className="text-sm text-gray-500">
              Ask the rider to show the 4-digit OTP from their app. Enter it below to confirm receipt.
            </p>
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3].map(i => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={otp[i] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    const arr = otp.split('');
                    arr[i] = val;
                    setOtp(arr.join('').slice(0, 4));
                    if (val && i < 3) {
                      const next = document.getElementById(`otp-${i + 1}`);
                      if (next) (next as HTMLInputElement).focus();
                    }
                  }}
                  id={`otp-${i}`}
                  className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                />
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setStage('search'); setReturnData(null); }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleVerify}
                disabled={loading || otp.length < 4}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 disabled:opacity-50 hover:from-red-700 hover:to-rose-700 transition-all"
              >
                {loading ? 'Verifying...' : 'Confirm Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage: Done */}
      {stage === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-green-900">Receipt Confirmed!</h2>
          <p className="text-green-700 text-sm">
            Items have been quarantined and marked as <strong>Received at Warehouse</strong>. Inventory updated successfully.
          </p>
          <p className="text-xs text-green-500 animate-pulse">Resetting in a moment...</p>
        </div>
      )}

      {/* Recent Verified */}
      {recentVerified.length > 0 && stage === 'search' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Recent Verifications</h3>
          {recentVerified.map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                <p className="text-xs text-gray-500">{item.shopName} · Qty {item.quantity}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
