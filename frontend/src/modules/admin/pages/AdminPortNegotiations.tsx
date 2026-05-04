import { useState, useEffect, useCallback } from 'react';
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
    const response = await adminConfirmPortOffer(offerId);
    if (response.success) {
      showToast('Order confirmed successfully!', 'success');
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
                          <div className="text-slate-700 font-medium">{offer.portId?.portName || 'N/A'}</div>
                          <div className="text-xs text-slate-400">{offer.portId?.mobile || ''}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-700">{offer.warehouseId?.warehouseName}</div>
                          <div className="text-[10px] text-slate-400">{offer.warehouseId?.address}</div>
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
        {selectedOffer && (
          <div className="lg:w-1/3 animate-in slide-in-from-right duration-300">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden sticky top-6">
              <div className="p-4 bg-teal-600 text-white flex justify-between items-center">
                <h3 className="font-bold">Negotiation Details</h3>
                <button onClick={() => setSelectedOffer(null)} className="text-white hover:bg-teal-700 p-1 rounded">
                  <span className="material-icons-outlined">close</span>
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Info summary */}
                <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Port Price</p>
                    <p className="text-lg font-bold text-slate-800">₹{selectedOffer.offeredPrice}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Admin Price</p>
                    <p className="text-lg font-bold text-amber-600">{selectedOffer.counterPrice ? `₹${selectedOffer.counterPrice}` : '--'}</p>
                  </div>
                </div>

                {/* History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">Negotiation History</h4>
                  <div className="space-y-4">
                    {selectedOffer.negotiationHistory?.map((entry: any, idx: number) => (
                      <div key={idx} className={`flex gap-3 ${entry.offeredBy === 'admin' ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex-1 p-3 rounded-lg text-sm ${entry.offeredBy === 'admin' ? 'bg-teal-50 border border-teal-100' : 'bg-slate-50 border border-slate-100'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-[10px] uppercase">{entry.offeredBy}</span>
                            <span className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="font-bold text-slate-700 mb-1">₹{entry.price}/kg</p>
                          {entry.notes && <p className="text-xs text-slate-500 italic">"{entry.notes}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Form */}
                {selectedOffer.status !== 'approved' && (
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Your Counter Price (₹)</label>
                      <input 
                        type="number" 
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                        placeholder="Enter price per kg"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Negotiation Notes</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add terms or instructions..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none h-20 resize-none"
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={handleCounter}
                        disabled={submitting}
                        className="flex-1 bg-white border border-teal-600 text-teal-600 py-2.5 rounded-lg text-sm font-bold hover:bg-teal-50 transition-all disabled:opacity-50"
                      >
                        Send Counter
                      </button>
                      <button 
                        onClick={() => handleConfirm(selectedOffer._id)}
                        disabled={submitting}
                        className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
                      >
                        Confirm Deal
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedOffer.status === 'approved' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="material-icons-outlined text-emerald-600 text-3xl mb-2">check_circle</span>
                    <p className="text-sm font-bold text-emerald-800">Deal Confirmed</p>
                    <p className="text-xs text-emerald-600 mt-1">This order has been finalized and requirement is closed.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
