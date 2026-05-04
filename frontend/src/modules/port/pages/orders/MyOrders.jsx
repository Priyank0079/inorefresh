import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import { getPortOrders } from '../../../../services/api/portOfferService';
import { useToast } from '../../../../context/ToastContext';

const MyOrders = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await getPortOrders();
        if (response.success) {
          setOrders(response.data);
        } else {
          showToast(response.message || 'Failed to fetch orders', 'error');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        showToast('An error occurred while fetching orders', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const requirementId = order.requirementId?.requirementId || '';
    const warehouseName = order.warehouseId?.warehouseName || '';
    const fishName = order.requirementId?.fishName || '';
    
    const matchesSearch = requirementId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fishName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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
                  {['All', 'approved', 'Delivered', 'In Transit', 'Pending', 'Cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${statusFilter === status ? 'text-teal-600 font-bold bg-teal-50/50' : 'text-slate-600'}`}
                    >
                      {status === 'approved' ? 'Confirmed' : status}
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
                <th className="px-6 py-4 font-bold">Order Date</th>
                <th className="px-6 py-4 font-bold">Warehouse</th>
                <th className="px-6 py-4 font-bold">Item & Qty</th>
                <th className="px-6 py-4 font-bold">Final Price</th>
                <th className="px-6 py-4 font-bold">Delivery Date</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-4"></div>
                      <p className="text-sm font-medium">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => navigate(`/port/orders/track/${order._id}`)}
                      className="text-sm font-bold text-teal-600 hover:underline"
                    >
                      {order.requirementId?.requirementId || 'N/A'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{order.warehouseId?.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{order.warehouseId?.city}, {order.warehouseId?.state}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{order.requirementId?.fishName}</p>
                    <p className="text-xs text-slate-500">{order.quantityOffered} KG</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">₹{order.offeredPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(order.deliveryDate)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status === 'approved' ? 'Confirmed' : order.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate(`/port/orders/track/${order._id}`)}
                      className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all ml-auto"
                    >
                      <span className="material-icons-outlined text-sm">local_shipping</span>
                      Track
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-medium">
                    <span className="material-icons-outlined text-4xl block mb-2 opacity-20">shopping_cart</span>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-sm text-slate-500">Showing {filteredOrders.length} entries</p>
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
