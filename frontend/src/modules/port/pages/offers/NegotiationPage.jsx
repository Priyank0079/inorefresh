import React, { useState, useEffect } from 'react';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import { getMyNegotiations, acceptCounter, counterOffer } from '../../../../services/api/portOfferService';
import { useToast } from '../../../../context/ToastContext';

const NegotiationPage = () => {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchNegotiations = async () => {
    setLoading(true);
    const response = await getMyNegotiations();
    if (response.success) {
      setNegotiations(response.data);
    } else {
      showToast(response.message || 'Failed to fetch negotiations', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const handleAcceptCounter = async (offerId) => {
    const response = await acceptCounter(offerId);
    if (response.success) {
      showToast('Counter offer accepted!', 'success');
      fetchNegotiations();
    } else {
      showToast(response.message || 'Failed to accept counter', 'error');
    }
  };

  const handleNewCounter = async (offerId) => {
    const price = prompt('Enter your counter price:');
    if (price && !isNaN(price)) {
      const response = await counterOffer(offerId, { price: Number(price) });
      if (response.success) {
        showToast('Counter offer sent!', 'success');
        fetchNegotiations();
      } else {
        showToast(response.message || 'Failed to send counter', 'error');
      }
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'countered': return 'Counter Received';
      case 'negotiating': return 'Negotiating';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Negotiations" 
        subtitle="Active price negotiations with Admin for warehouse requirements"
      />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : negotiations.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons-outlined text-3xl">handshake</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Active Negotiations</h3>
          <p className="text-slate-500 max-w-xs mx-auto">You don't have any active price negotiations with warehouses at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {negotiations.map((neg) => (
            <div key={neg._id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                    <span className="material-icons-outlined">handshake</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{neg.requirementId?.fishName} - {neg.requirementId?.requirementId}</h4>
                    <p className="text-xs text-slate-500">Warehouse: {neg.warehouseId?.warehouseName} • {neg.warehouseId?.address}</p>
                  </div>
                </div>
                <StatusBadge status={getStatusLabel(neg.status)} />
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Last Offer</p>
                  <p className="text-xl font-bold text-slate-800">₹{neg.offeredPrice}<span className="text-sm font-normal text-slate-400 ml-1">/kg</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Counter Received</p>
                  <p className={`text-xl font-bold ${neg.counterPrice ? 'text-amber-600' : 'text-slate-300'}`}>
                    {neg.counterPrice ? `₹${neg.counterPrice}` : 'Waiting...'}<span className="text-sm font-normal text-slate-400 ml-1">/kg</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleAcceptCounter(neg._id)}
                    disabled={neg.status !== 'countered'}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      neg.status === 'countered' 
                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/10 hover:bg-teal-700' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Accept Counter
                  </button>
                  <button 
                    onClick={() => handleNewCounter(neg._id)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
                  >
                    New Counter
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400 italic">Last update: {formatTimeAgo(neg.updatedAt)} ago</p>
                <button className="text-xs font-bold text-teal-600 hover:underline">View History</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NegotiationPage;
