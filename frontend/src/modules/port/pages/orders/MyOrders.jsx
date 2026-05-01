import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import { dummyOrders } from '../../data/dummyOrders';

const MyOrders = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = dummyOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.fishName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageTitle 
        title="My Orders" 
        subtitle="Manage confirmed orders and shipment tracking"
        actions={
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                type="text" 
                placeholder="Search orders..." 
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
                  {['All', 'Confirmed', 'Delivered', 'In Transit', 'Pending', 'Cancelled'].map((status) => (
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
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Order Date</th>
                <th className="px-6 py-4 font-bold">Warehouse</th>
                <th className="px-6 py-4 font-bold">Item & Qty</th>
                <th className="px-6 py-4 font-bold">Final Price</th>
                <th className="px-6 py-4 font-bold">Transport</th>
                <th className="px-6 py-4 font-bold">Delivery Date</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => navigate('/port/orders/track')}
                      className="text-sm font-bold text-teal-600 hover:underline"
                    >
                      {order.id}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{order.orderDate}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{order.warehouse}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{order.fishName}</p>
                    <p className="text-xs text-slate-500">{order.quantity}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">₹{parseInt(order.finalPrice).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{order.transportMode}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{order.deliveryDate}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate('/port/orders/track')}
                      className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all ml-auto"
                    >
                      <span className="material-icons-outlined text-sm">local_shipping</span>
                      Track
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-400 font-medium">
                    <span className="material-icons-outlined text-4xl block mb-2 opacity-20">shopping_cart</span>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-sm text-slate-500">Showing {filteredOrders.length} of {dummyOrders.length} entries</p>
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
    </div>
  );
};

export default MyOrders;
