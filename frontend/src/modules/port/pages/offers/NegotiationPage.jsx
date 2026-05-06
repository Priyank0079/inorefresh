import React, { useState, useEffect } from 'react';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import { getMyNegotiations, acceptCounter, counterOffer } from '../../../../services/api/portOfferService';
import { useToast } from '../../../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const NegotiationPage = () => {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  // State for active negotiation form
  const [activeOfferId, setActiveOfferId] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (!window.confirm('Are you sure you want to accept this price? This will finalize the deal.')) return;
    
    setSubmitting(true);
    const response = await acceptCounter(offerId);
    if (response.success) {
      showToast('Deal Done! Order confirmed.', 'success');
      fetchNegotiations();
    } else {
      showToast(response.message || 'Failed to accept counter', 'error');
    }
    setSubmitting(false);
  };

  const handleNewCounter = async (offerId) => {
    if (!counterPrice || isNaN(Number(counterPrice))) {
      showToast('Please enter a valid counter price', 'error');
      return;
    }

    setSubmitting(true);
    const response = await counterOffer(offerId, { price: Number(counterPrice), notes });
    if (response.success) {
      showToast('Counter offer sent!', 'success');
      setActiveOfferId(null);
      setCounterPrice('');
      setNotes('');
      fetchNegotiations();
    } else {
      showToast(response.message || 'Failed to send counter', 'error');
    }
    setSubmitting(false);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'countered': return 'Admin Countered';
      case 'negotiating': return 'Negotiating';
      case 'approved': return 'Confirmed';
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
    <div className="space-y-6 max-w-5xl mx-auto">
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
            <div key={neg._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shadow-inner">
                    <span className="material-icons-outlined">storefront</span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-800 tracking-tight uppercase">
                      {neg.requirementId?.fishName}
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      REQ: {neg.requirementId?.requirementId} • {neg.warehouseId?.warehouseName || neg.warehouseId?.name}
                    </p>
                  </div>
                </div>
                <StatusBadge status={getStatusLabel(neg.status)} />
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Price Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Last Offer</p>
                    <p className="text-2xl font-black text-slate-800">
                      ₹{neg.offeredPrice}<span className="text-xs font-bold text-slate-400 ml-1">/kg</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">Qty: {neg.quantityOffered}kg</p>
                  </div>
                  <div className={`border rounded-2xl p-4 ${neg.counterPrice ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${neg.counterPrice ? 'text-amber-600' : 'text-slate-400'}`}>
                      Admin Counter
                    </p>
                    <p className={`text-2xl font-black ${neg.counterPrice ? 'text-amber-700' : 'text-slate-300'}`}>
                      {neg.counterPrice ? `₹${neg.counterPrice}` : 'Waiting...'}<span className="text-xs font-bold text-slate-400 ml-1">/kg</span>
                    </p>
                    {neg.counterPrice && <p className="text-[10px] text-amber-600 mt-1 font-semibold">Action Required</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {activeOfferId === neg._id ? (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</div>
                          <input
                            type="number"
                            value={counterPrice}
                            onChange={(e) => setCounterPrice(e.target.value)}
                            placeholder="Enter new price"
                            className="w-full pl-8 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-lg font-black text-slate-800 focus:border-teal-500 focus:ring-0 outline-none transition-all"
                          />
                        </div>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add a note (optional)..."
                          className="w-full px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:border-teal-500 focus:ring-0 outline-none transition-all"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleNewCounter(neg._id)}
                            disabled={submitting || !counterPrice}
                            className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
                          >
                            Send Offer
                          </button>
                          <button
                            onClick={() => {
                              setActiveOfferId(null);
                              setCounterPrice('');
                              setNotes('');
                            }}
                            className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-3"
                      >
                        <button 
                          onClick={() => handleAcceptCounter(neg._id)}
                          disabled={neg.status !== 'countered' || submitting}
                          className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            neg.status === 'countered' 
                              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 hover:-translate-y-0.5' 
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="material-icons-outlined text-lg">verified</span>
                          Deal Done
                        </button>
                        <button 
                          onClick={() => {
                            setActiveOfferId(neg._id);
                            setCounterPrice(neg.counterPrice?.toString() || neg.offeredPrice.toString());
                          }}
                          disabled={submitting}
                          className="w-full py-3 border-2 border-slate-900 text-slate-900 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                        >
                          Negotiate
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Last update: {formatTimeAgo(neg.updatedAt)} ago
                </p>
                <div className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline cursor-pointer">
                  View History
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NegotiationPage;
