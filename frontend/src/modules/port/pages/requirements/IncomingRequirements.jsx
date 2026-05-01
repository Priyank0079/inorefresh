import React, { useState } from 'react';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import SendOfferModal from '../../components/modals/SendOfferModal';
import { dummyRequirements } from '../../data/dummyRequirements';

const IncomingRequirements = () => {
  const [requirements, setRequirements] = useState(dummyRequirements);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const handleSendOffer = (req) => {
    setSelectedReq(req);
    setIsModalOpen(true);
  };

  const onOfferSent = (reqId) => {
    setRequirements(prev => prev.map(req => 
      req.id === reqId ? { ...req, status: 'Negotiating' } : req
    ));
    // In a real app, we would also add to dummyOffers
  };

  const handleReject = (reqId) => {
    if (window.confirm('Are you sure you want to reject this requirement?')) {
      setRequirements(prev => prev.filter(req => req.id !== reqId));
    }
  };

  const handleView = (req) => {
    alert(`Viewing Details for ${req.id}:\nFish: ${req.fishName}\nWarehouse: ${req.warehouseName}\nQty: ${req.quantityRequired}\nTarget Price: ₹${req.targetPrice}`);
  };

  // Filter Logic
  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = req.fishName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         req.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Incoming Requirements" 
        subtitle="Manage and respond to real-time warehouse requests"
        actions={
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                type="text" 
                placeholder="Search fish, warehouse..." 
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none w-full sm:w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold transition-all ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white border-slate-200 text-slate-600 hover:shadow-sm'}`}
              >
                <span className="material-icons-outlined text-lg">filter_list</span>
                {statusFilter === 'All' ? 'Filters' : `Status: ${statusFilter}`}
              </button>
              
              {showFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {['All', 'Open', 'Pending', 'Negotiating', 'Expired'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${statusFilter === status ? 'text-teal-600 font-bold bg-teal-50/50' : 'text-slate-600'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Requirement ID</th>
                <th className="px-6 py-4 font-bold">Req. Date</th>
                <th className="px-6 py-4 font-bold">Warehouse</th>
                <th className="px-6 py-4 font-bold">Fish Details</th>
                <th className="px-6 py-4 font-bold">Quantity</th>
                <th className="px-6 py-4 font-bold">Target Price</th>
                <th className="px-6 py-4 font-bold">Deadline</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequirements.length > 0 ? filteredRequirements.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-teal-600">{req.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{req.createdAt}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{req.warehouseName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">GUJARAT, INDIA</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{req.fishName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{req.category}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{req.quality}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-semibold">{req.quantityRequired}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-bold">₹{req.targetPrice}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{req.deadline}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {req.status === 'Open' || req.status === 'Pending' ? (
                        <button 
                          onClick={() => handleSendOffer(req)}
                          className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-teal-600/10"
                        >
                          Send Offer
                        </button>
                      ) : (
                        <button 
                          className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed opacity-0 group-hover:opacity-100"
                          disabled
                        >
                          Offered
                        </button>
                      )}
                      <button 
                        onClick={() => handleView(req)}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
                      >
                        <span className="material-icons-outlined text-lg">visibility</span>
                      </button>
                      <button 
                        onClick={() => handleReject(req.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all"
                      >
                        <span className="material-icons-outlined text-lg">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-medium">
                    <span className="material-icons-outlined text-4xl block mb-2 opacity-20">inventory_2</span>
                    No requirements found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-sm text-slate-500">Showing {filteredRequirements.length} of {requirements.length} entries</p>
          <div className="flex items-center gap-1">
            <button className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled>
              <span className="material-icons-outlined">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-teal-600 text-white text-sm font-bold shadow-md shadow-teal-600/20">1</button>
            <button className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled>
              <span className="material-icons-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <SendOfferModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        requirement={selectedReq}
        onOfferSent={onOfferSent}
      />
    </div>
  );
};

export default IncomingRequirements;
