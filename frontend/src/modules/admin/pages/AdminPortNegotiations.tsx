import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGetAllPortOffers, adminCounterPortOffer, adminConfirmPortOffer } from '../../../services/api/adminPortService';
import { useToast } from '../../../context/ToastContext';
import StatusBadge from '../../../components/common/StatusBadge';
import PageTitle from '../../../components/common/PageTitle';

export default function AdminPortNegotiations() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const response = await adminGetAllPortOffers();
    if (response.success) {
      setOffers(response.data);
    } else {
      showToast(response.message || 'Failed to fetch offers', 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleCounter = async () => {
    if (!counterPrice || isNaN(Number(counterPrice))) {
      showToast('Please enter a valid counter price', 'error');
      return;
    }

    setSubmitting(true);
    const response = await adminCounterPortOffer(selectedOffer._id, {
      price: Number(counterPrice),
      notes
    });

    if (response.success) {
      showToast('Counter offer sent to port successfully', 'success');
      setCounterPrice('');
      setNotes('');
      fetchOffers();
      // Update selected offer to show latest history
      const updatedOffer = response.data;
      setSelectedOffer(updatedOffer);
    } else {
      showToast(response.message || 'Failed to send counter offer', 'error');
    }
    setSubmitting(false);
  };

  const handleConfirm = async (offerId: string) => {
    if (!window.confirm('Are you sure you want to confirm this order? This will close the requirement.')) return;
    
    setSubmitting(true);
    const response = await adminConfirmPortOffer(offerId, notes);
    if (response.success) {
      showToast('Order confirmed successfully!', 'success');
      setNotes('');
      fetchOffers();
      setSelectedOffer(null);
    } else {
      showToast(response.message || 'Failed to confirm order', 'error');
    }
    setSubmitting(false);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'New Offer';
      case 'countered': return 'Admin Countered';
      case 'negotiating': return 'Port Countered';
      case 'approved': return 'Confirmed';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50">
      <div className="p-6">
        <PageTitle
          title="Port Negotiations"
          subtitle="Manage and negotiate fish supply offers from ports for warehouse requirements"
        />
      </div>

      <div className="px-6 flex flex-col lg:flex-row gap-6 pb-12">
        {/* Offers List */}
        <div className={`flex-1 transition-all duration-300 ${selectedOffer ? 'lg:w-2/3' : 'w-full'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-left font-bold text-slate-600">Requirement</th>
                    <th className="p-4 text-left font-bold text-slate-600">Port User</th>
                    <th className="p-4 text-left font-bold text-slate-600">Warehouse</th>
                    <th className="p-4 text-right font-bold text-slate-600">Price (₹)</th>
                    <th className="p-4 text-center font-bold text-slate-600">Qty</th>
                    <th className="p-4 text-center font-bold text-slate-600">Delivery</th>
                    <th className="p-4 text-center font-bold text-slate-600">Status</th>
                    <th className="p-4 text-center font-bold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={8} className="p-12 text-center text-slate-400">Loading offers...</td></tr>
                  ) : offers.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-slate-400">No active negotiations found.</td></tr>
                  ) : (
                    offers.map((offer) => (
                      <tr
                        key={offer._id}
                        className={`hover:bg-teal-50/30 transition-colors cursor-pointer ${selectedOffer?._id === offer._id ? 'bg-teal-50' : ''}`}
                        onClick={() => setSelectedOffer(offer)}
                      >
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{offer.requirementId?.fishName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{offer.requirementId?.requirementId}</div>
                        </td>
                        <td className="p-4">
                          {typeof offer.portId === 'object' && offer.portId !== null ? (
                            <>
                              <div className="text-slate-700 font-bold uppercase tracking-tight">
                                {offer.portId.portName || offer.portId.name || offer.portId.fullName || 'Unnamed Port'}
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                Mgr: {offer.portId.managerName || 'N/A'}
                              </div>
                              <div className="text-[10px] text-slate-400">{offer.portId.mobile || ''}</div>
                            </>
                          ) : (
                            <div className="text-slate-400 italic">ID: {offer.portId || 'Unknown'}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-slate-700 font-medium">
                            {offer.warehouseId?.warehouseName || offer.warehouseId?.name || offer.warehouseId?.storeName || (typeof offer.warehouseId === 'string' ? 'ID: ' + offer.warehouseId : 'Unknown Warehouse')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {offer.warehouseId?.address || offer.warehouseId?.location?.address || offer.warehouseId?.city || ''}
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-teal-600">₹{offer.offeredPrice}</td>
                        <td className="p-4 text-center text-slate-600">{offer.quantityOffered} kg</td>
                        <td className="p-4 text-center">
                          <div className="text-xs font-bold text-slate-600">
                            {offer.deliveryDate ? Math.ceil((new Date(offer.deliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : '--'} Days
                          </div>
                          <div className="text-[10px] text-slate-400">Est. Arrival</div>
                        </td>
                        <td className="p-4 text-center">
                          <StatusBadge status={getStatusLabel(offer.status)} />
                        </td>
                        <td className="p-4 text-center">
                          <button
                            className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOffer(offer);
                            }}
                          >
                            <span className="material-icons-outlined text-lg">edit_note</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Negotiation Panel */}
        <AnimatePresence>
          {selectedOffer && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:w-1/3 min-w-[400px] z-20"
            >
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden sticky top-6 flex flex-col max-h-[calc(100vh-80px)]">
                {/* Header */}
                <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800">Negotiation Details</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-xs font-medium rounded-md">Active</span>
                      <span className="text-xs text-slate-400 font-medium">#{selectedOffer._id.slice(-6).toUpperCase()}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedOffer(null)} 
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <span className="material-icons-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {/* Price Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500 mb-1">Port's Offer</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-semibold text-slate-800">₹{selectedOffer.offeredPrice}</span>
                        <span className="text-xs font-medium text-slate-400">/kg</span>
                      </div>
                    </div>
                    <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-4">
                      <p className="text-xs font-medium text-teal-700 mb-1">Your Counter</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-semibold text-teal-800">
                          {selectedOffer.counterPrice ? `₹${selectedOffer.counterPrice}` : '--'}
                        </span>
                        {selectedOffer.counterPrice && <span className="text-xs font-medium text-teal-600">/kg</span>}
                      </div>
                    </div>
                  </div>

                  {/* Port Partner Profile */}
                  {typeof selectedOffer.portId === 'object' && selectedOffer.portId !== null && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                        <span className="material-icons-outlined">storefront</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 truncate">{selectedOffer.portId.portName || selectedOffer.portId.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedOffer.portId.managerName || 'Operations Manager'}
                        </p>
                      </div>
                      {selectedOffer.portId.mobile && (
                        <a 
                          href={`tel:${selectedOffer.portId.mobile}`} 
                          className="w-8 h-8 flex items-center justify-center text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                          title="Call Port"
                        >
                          <span className="material-icons-outlined text-sm">call</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Negotiation History */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-slate-800">History</h4>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {selectedOffer.negotiationHistory?.length || 0} updates
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {selectedOffer.negotiationHistory?.map((entry: any, idx: number) => {
                        const isAdmin = entry.offeredBy === 'admin';
                        return (
                          <div key={idx} className="flex gap-3 text-sm">
                            <div className="mt-1">
                              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-slate-400' : 'bg-teal-500'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-medium text-slate-700">
                                  {isAdmin ? 'You' : 'Port'}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-800 font-semibold mb-1">₹{entry.price} <span className="text-xs font-normal text-slate-500">/kg</span></p>
                              {entry.notes && (
                                <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Form */}
                {selectedOffer.status !== 'approved' && (
                  <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-slate-700">Counter Price (₹)</label>
                        <button 
                          onClick={() => setCounterPrice(selectedOffer.offeredPrice.toString())}
                          className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                        >
                          Match Port
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</div>
                        <input
                          type="number"
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-shadow"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-slate-700">Notes</label>
                        <div className="flex gap-1.5">
                           {['Deal Done', 'Negotiate', 'Call Me'].map(msg => (
                             <button
                               key={msg}
                               type="button"
                               onClick={() => setNotes(msg)}
                               className={`text-xs px-2 py-1 rounded border transition-colors ${notes === msg ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                             >
                               {msg}
                             </button>
                           ))}
                        </div>
                      </div>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your note here..."
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none h-20 resize-none transition-shadow"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleCounter}
                        disabled={submitting || !counterPrice}
                        className="flex-1 bg-white border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        Send Counter
                      </button>
                      <button
                        onClick={() => handleConfirm(selectedOffer._id)}
                        disabled={submitting}
                        className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                         <span className="material-icons-outlined text-sm">check_circle</span>
                         Confirm Deal
                      </button>
                    </div>
                  </div>
                )}

                {selectedOffer.status === 'approved' && (
                  <div className="p-6 bg-teal-50 text-center border-t border-teal-100">
                    <span className="material-icons-outlined text-teal-500 text-3xl mb-2">check_circle</span>
                    <h4 className="text-lg font-semibold text-teal-800 mb-1">Deal Finalized</h4>
                    <p className="text-sm text-teal-600">This transaction is confirmed and moving to fulfillment.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
