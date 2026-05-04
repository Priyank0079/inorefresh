import React, { useState, useEffect } from 'react';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import { getMyNegotiations } from '../../../../services/api/portOfferService';
import { useNavigate } from 'react-router-dom';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const MyOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const response = await getMyNegotiations();
        if (response.success) {
          setOffers(response.data);
        }
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle 
        title="My Offers" 
        subtitle="Track and manage all your submitted offers"
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Offer ID</th>
                <th className="px-6 py-4 font-bold">Requirement</th>
                <th className="px-6 py-4 font-bold">Warehouse</th>
                <th className="px-6 py-4 font-bold">Details</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Created Date</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offers.map((offer) => (
                <tr key={offer._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-teal-600">OFF-{offer._id.slice(-4).toUpperCase()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{offer.requirementId?.requirementId || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{offer.warehouseId?.warehouseName || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{offer.requirementId?.fishName || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{offer.quantityOffered} KG @ ₹{offer.offeredPrice}/kg</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={offer.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(offer.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/port/offers/negotiations`)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                      >
                        View
                      </button>
                      <button className="p-2 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition-all">
                        <span className="material-icons-outlined text-lg">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-sm italic">No offers found. Send an offer from the requirements section.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyOffers;
