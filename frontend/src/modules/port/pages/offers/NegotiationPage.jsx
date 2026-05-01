import React from 'react';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';

const NegotiationPage = () => {
  const negotiations = [
    {
      id: 'NEG-101',
      requirementId: 'REQ-002',
      fishName: 'Kingfish',
      warehouse: 'Mangrol Storage',
      currentOffer: '₹1150',
      warehouseCounter: '₹1100',
      lastUpdate: '2 hours ago',
      status: 'Negotiating'
    }
  ];

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Negotiations" 
        subtitle="Active price and terms negotiations with warehouses"
      />

      <div className="grid grid-cols-1 gap-6">
        {negotiations.map((neg) => (
          <div key={neg.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                  <span className="material-icons-outlined">handshake</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{neg.fishName} - {neg.id}</h4>
                  <p className="text-xs text-slate-500">Requirement: {neg.requirementId} • {neg.warehouse}</p>
                </div>
              </div>
              <StatusBadge status={neg.status} />
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Last Offer</p>
                <p className="text-xl font-bold text-slate-800">{neg.currentOffer}<span className="text-sm font-normal text-slate-400 ml-1">/kg</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warehouse Counter</p>
                <p className="text-xl font-bold text-amber-600">{neg.warehouseCounter}<span className="text-sm font-normal text-slate-400 ml-1">/kg</span></p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-teal-600/10 hover:bg-teal-700 transition-all">
                  Accept Counter
                </button>
                <button className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">
                  New Counter
                </button>
              </div>
            </div>
            
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400 italic">Last update: {neg.lastUpdate}</p>
              <button className="text-xs font-bold text-teal-600 hover:underline">View History</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NegotiationPage;
