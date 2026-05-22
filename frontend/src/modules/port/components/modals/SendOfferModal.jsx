import React, { useState } from 'react';
import { createOffer } from '../../../../services/api/portOfferService';
import { useToast } from '../../../../context/ToastContext';
import { useAuth } from '../../../../context/AuthContext';

const SendOfferModal = ({ isOpen, onClose, requirement, onOfferSent }) => {
  const [formData, setFormData] = useState({
    offeredQuantity: '',
    offeredPrice: '',
    deliveryDays: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Calculate delivery date based on days
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + parseInt(formData.deliveryDays || 0));

      const offerData = {
        requirementId: requirement._id,
        portId: user?.id || user?._id,
        offeredPrice: Number(formData.offeredPrice),
        quantityOffered: Number(formData.offeredQuantity),
        deliveryDate: deliveryDate.toISOString(),
        notes: formData.notes
      };

      const response = await createOffer(offerData);

      if (response.success) {
        showToast('Offer submitted successfully!', 'success');
        if (onOfferSent) {
          onOfferSent(requirement._id);
        }
        onClose();
        // Reset form
        setFormData({
          offeredQuantity: '',
          offeredPrice: '',
          deliveryDays: '',
          notes: ''
        });
      } else {
        showToast(response.message || 'Failed to submit offer', 'error');
      }
    } catch (error) {
      showToast('An error occurred while submitting the offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Send New Offer</h3>
            <div className="flex gap-4 mt-1">
              <p className="text-slate-500 text-xs">For Requirement: {requirement?.requirementId}</p>
              <p className="text-teal-600 text-xs font-semibold">Port ID: {user?.id || user?._id || '...'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-all">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fish Name</label>
              <input type="text" value={requirement?.fishName} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-800" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Qty</label>
              <input type="text" value={`${requirement?.quantityRequired} ${requirement?.unit}`} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offered Quantity (KG)</label>
              <input
                type="number"
                name="offeredQuantity"
                value={formData.offeredQuantity}
                onChange={handleChange}
                required
                min="1"
                placeholder="e.g. 500"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price per KG (₹)</label>
              <input
                type="number"
                name="offeredPrice"
                value={formData.offeredPrice}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                placeholder={`Target: ₹${requirement?.targetPrice || '...'}`}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Delivery (Days)</label>
            <input
              type="number"
              name="deliveryDays"
              value={formData.deliveryDays}
              onChange={handleChange}
              required
              min="1"
              placeholder="e.g. 2"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Additional Notes</label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3" 
              placeholder="Specify any other terms..." 
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
            ></textarea>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendOfferModal;
