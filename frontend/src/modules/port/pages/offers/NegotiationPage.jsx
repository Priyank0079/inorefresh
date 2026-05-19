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
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      <PageTitle 
        title="Negotiations" 
        subtitle="Active price negotiations with Admin for warehouse requirements"
      />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : negotiations.length === 0 ? (
        <div className="bg-white rounded-xl p-8 sm:p-12 text-center border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons-outlined text-3xl">handshake</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">No Active Negotiations</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">You don't have any active price negotiations with warehouses at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {negotiations.map((neg) => (
            <div 
              key={neg._id} 
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/40">
                <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <span className="material-icons-outlined text-base sm:text-xl">storefront</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight uppercase truncate">
                      {neg.requirementId?.fishName}
                    </h4>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-0.5 truncate">
                      REQ: {neg.requirementId?.requirementId} • {neg.warehouseId?.warehouseName || neg.warehouseId?.name}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge status={getStatusLabel(neg.status)} />
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {/* Price Info Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Your Offer */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Last Offer</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-800">
                      ₹{neg.offeredPrice}
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-400 ml-0.5">/kg</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">Qty: {neg.quantityOffered}kg</p>
                  </div>

                  {/* Admin Counter */}
                  <div className={`border rounded-xl p-3 sm:p-4 transition-colors ${
                    neg.counterPrice 
                      ? 'bg-amber-50/30 border-amber-200/60 hover:bg-amber-50/50' 
                      : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                  }`}>
                    <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      neg.counterPrice ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      Admin Counter
                    </p>
                    <p className={`text-lg sm:text-xl md:text-2xl font-black ${
                      neg.counterPrice ? 'text-amber-700' : 'text-slate-300'
                    }`}>
                      {neg.counterPrice ? (
                        <>
                          ₹{neg.counterPrice}
                          <span className="text-[10px] sm:text-xs font-semibold text-amber-500/80 ml-0.5">/kg</span>
                        </>
                      ) : (
                        <span className="text-xs sm:text-sm font-medium text-slate-400 italic">Waiting...</span>
                      )}
                    </p>
                    {neg.counterPrice ? (
                      <span className="text-[10px] text-amber-600 mt-1 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Action Required
                      </span>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">Pending Review</p>
                    )}
                  </div>
                </div>

                {/* Action Form or Buttons */}
                <div className="flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {activeOfferId === neg._id ? (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2.5"
                      >
                        <div className="relative group">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm sm:text-base">₹</div>
                          <input
                            type="number"
                            value={counterPrice}
                            onChange={(e) => setCounterPrice(e.target.value)}
                            placeholder="Enter new price"
                            className="w-full pl-8 pr-4 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-sm sm:text-base font-bold text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
                          />
                        </div>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add a note (optional)..."
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleNewCounter(neg._id)}
                            disabled={submitting || !counterPrice}
                            className="flex-1 bg-slate-900 text-white py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <span className="material-icons-outlined text-sm">send</span>
                            Send Offer
                          </button>
                          <button
                            onClick={() => {
                              setActiveOfferId(null);
                              setCounterPrice('');
                              setNotes('');
                            }}
                            className="px-4 py-2 sm:py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-row md:flex-col gap-2.5"
                      >
                        <button 
                          onClick={() => handleAcceptCounter(neg._id)}
                          disabled={neg.status !== 'countered' || submitting}
                          className={`flex-1 md:w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                            neg.status === 'countered' 
                              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10 hover:bg-teal-700 hover:-translate-y-0.5' 
                              : 'bg-slate-50 text-slate-400 border border-slate-200/50 cursor-not-allowed'
                          }`}
                        >
                          <span className="material-icons-outlined text-base sm:text-lg">verified</span>
                          Deal Done
                        </button>
                        <button 
                          onClick={() => {
                            setActiveOfferId(neg._id);
                            setCounterPrice(neg.counterPrice?.toString() || neg.offeredPrice.toString());
                          }}
                          disabled={submitting}
                          className="flex-1 md:w-full py-2.5 sm:py-3 border border-slate-900 text-slate-900 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="material-icons-outlined text-base sm:text-lg">gavel</span>
                          Negotiate
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Card Footer */}
              <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-slate-50/20 border-t border-slate-100/80 flex items-center justify-between">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="material-icons-outlined text-xs text-slate-400">schedule</span>
                  Last update: {formatTimeAgo(neg.updatedAt)} ago
                </p>
                <button className="text-[9px] sm:text-[10px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-wider hover:underline transition-colors flex items-center gap-0.5 bg-transparent border-0 cursor-pointer p-0 outline-none">
                  <span className="material-icons-outlined text-xs">history</span>
                  View History
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NegotiationPage;
