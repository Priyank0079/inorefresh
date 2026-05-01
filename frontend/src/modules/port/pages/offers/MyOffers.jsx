import React from 'react';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import { dummyOffers } from '../../data/dummyOffers';

const MyOffers = () => {
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
              {dummyOffers.map((offer) => (
                <tr key={offer.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-teal-600">{offer.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{offer.requirementId}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{offer.warehouseName}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{offer.fishName}</p>
                    <p className="text-xs text-slate-500">{offer.offeredQuantity} @ ₹{offer.offeredPrice}/kg</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={offer.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{offer.createdAt}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                        View
                      </button>
                      <button className="p-2 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition-all">
                        <span className="material-icons-outlined text-lg">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyOffers;
