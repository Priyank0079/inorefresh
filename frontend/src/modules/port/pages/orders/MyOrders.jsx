import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import { getPortOrders, updateDeliveryDetails } from '../../../../services/api/portOfferService';
import { useToast } from '../../../../context/ToastContext';
import { useRefresh } from '@/context/RefreshContext';

const getWarehouseName = (warehouse) => {
  if (!warehouse) return '';
  if (typeof warehouse === 'string') return warehouse;
  return warehouse.warehouseName || warehouse.storeName || warehouse.name || '';
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { registerRefresh, unregisterRefresh } = useRefresh();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    vehicleType: 'Truck',
    estimatedArrival: '',
    trackingNumber: '',
    additionalInfo: '',
    status: 'In Transit'
  });

  const fetchOrders = useCallback(async () => {
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
  }, [showToast]);

  useEffect(() => {
    fetchOrders();

    // Socket listening for real-time updates
    const portId = localStorage.getItem('userId');
    const socket = window.socket; // Assuming socket is available globally or through a hook

    if (socket && portId) {
      socket.on('delivery-update', (data) => {
        console.log('Received delivery update:', data);
        fetchOrders(); // Refresh the list
      });

      return () => {
        socket.off('delivery-update');
      };
    }
  }, [fetchOrders]);

  useEffect(() => {
    registerRefresh(fetchOrders);
    return () => unregisterRefresh();
  }, [fetchOrders, registerRefresh, unregisterRefresh]);

  const handleUpdateDelivery = (order) => {
    setSelectedOrder(order);
    setDeliveryData({
      vehicleType: order.deliveryDetails?.vehicleType || 'Truck',
      estimatedArrival: order.deliveryDetails?.estimatedArrival ? new Date(order.deliveryDetails.estimatedArrival).toISOString().split('T')[0] : '',
      trackingNumber: order.deliveryDetails?.trackingNumber || '',
      additionalInfo: order.deliveryDetails?.additionalInfo || '',
      status: order.status || 'In Transit'
    });
    setShowDeliveryModal(true);
  };

  const submitDeliveryUpdate = async () => {
    if (!deliveryData.estimatedArrival) {
      showToast('Please provide an estimated arrival date', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await updateDeliveryDetails(selectedOrder._id, deliveryData);
      if (response.success) {
        // Update local state with the new delivery data
        setOrders(prev => prev.map(order =>
          order._id === selectedOrder._id
            ? {
                ...order,
                deliveryDetails: {
                  ...order.deliveryDetails,
                  ...deliveryData
                },
                status: deliveryData.status || order.status
              }
            : order
        ));

        setShowDeliveryModal(false);
        setSelectedOrder(null);

        // Reset filter to 'All' so user can see the updated order
        setStatusFilter('All');

        showToast('✓ Delivery updated successfully! Showing all orders.', 'success');
      } else {
        showToast(response.message || 'Failed to update delivery', 'error');
      }
    } catch (error) {
      showToast('An error occurred during update', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const requirementId = order.requirementId?.requirementId || '';
    const warehouseName = getWarehouseName(order.warehouseId);
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
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search orders..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none w-full transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative z-50">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white border-slate-200 text-slate-600 hover:shadow-sm'}`}
              >
                <span className="material-icons-outlined text-lg">filter_list</span>
                <span className="hidden sm:inline">{statusFilter === 'All' ? 'Filters' : `Status: ${statusFilter}`}</span>
                <span className="sm:hidden">Filters</span>
              </button>

              {showFilters && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filter by Status</p>
                    </div>
                    {['All', 'approved', 'Delivered', 'In Transit', 'Pending', 'Cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                          statusFilter === status
                            ? 'bg-teal-50 text-teal-700 font-bold border-l-4 border-teal-600 pl-3'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {statusFilter === status && <span className="material-icons-outlined text-base">check</span>}
                          {status === 'approved' ? 'Confirmed' : status}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
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
                <th className="px-6 py-4 font-bold">Delivery Date / ETA</th>
                <th className="px-6 py-4 font-bold">Tracking Info</th>
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
                    <p className="text-sm font-semibold text-slate-800">{getWarehouseName(order.warehouseId) || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{order.warehouseId?.city}, {order.warehouseId?.state}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{order.requirementId?.fishName}</p>
                    <p className="text-xs text-slate-500">{order.quantityOffered} KG</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">₹{order.offeredPrice.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">{formatDate(order.deliveryDate)}</p>
                      {order.deliveryDetails?.estimatedArrival && (
                        <p className="text-[10px] text-teal-600 font-bold flex items-center gap-1">
                          <span className="material-icons-outlined text-[12px]">event_available</span>
                          ETA: {formatDate(order.deliveryDetails.estimatedArrival)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {order.deliveryDetails?.trackingNumber ? (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Tracking</p>
                        <p className="text-xs font-bold text-slate-700">{order.deliveryDetails.trackingNumber}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No Tracking</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status === 'approved' ? 'Confirmed' : order.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateDelivery(order)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 hover:shadow-md transition-all"
                        disabled={order.status === 'Delivered' || order.status === 'Cancelled'}
                      >
                        <span className="material-icons-outlined text-sm">local_shipping</span>
                        Update Delivery
                      </button>
                      <button 
                        onClick={() => navigate(`/port/orders/track/${order._id}`)}
                        className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all"
                      >
                        <span className="material-icons-outlined text-sm">visibility</span>
                        Track
                      </button>
                    </div>
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

      {/* Delivery Update Modal */}
      {showDeliveryModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-teal-600 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Delivery Update</h3>
                <p className="text-teal-100 text-[10px] font-bold uppercase tracking-wider">{selectedOrder.requirementId?.requirementId}</p>
              </div>
              <button onClick={() => setShowDeliveryModal(false)} className="hover:bg-teal-700 p-2 rounded-full transition-colors">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Order Info Summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Warehouse</p>
                  <p className="text-sm font-bold text-slate-800">{getWarehouseName(selectedOrder.warehouseId) || 'N/A'}</p>
                  <p className="text-[10px] text-slate-500">{selectedOrder.warehouseId?.address || (selectedOrder.warehouseId?.city + ', ' + selectedOrder.warehouseId?.state)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Fish Details</p>
                  <p className="text-sm font-bold text-slate-800">{selectedOrder.requirementId?.fishName}</p>
                  <p className="text-[10px] text-slate-500">{selectedOrder.quantityOffered} KG</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Vehicle Type</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={deliveryData.vehicleType}
                    onChange={(e) => setDeliveryData({...deliveryData, vehicleType: e.target.value})}
                  >
                    <option value="Truck">Truck</option>
                    <option value="Ship">Ship</option>
                    <option value="Plane">Plane</option>
                    <option value="Bus">Bus</option>
                    <option value="Train">Train</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Estimated Arrival</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={deliveryData.estimatedArrival}
                    onChange={(e) => setDeliveryData({...deliveryData, estimatedArrival: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Tracking / LR Number</label>
                <input 
                  type="text"
                  placeholder="Enter tracking or vehicle number"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  value={deliveryData.trackingNumber}
                  onChange={(e) => setDeliveryData({...deliveryData, trackingNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Delivery Status</label>
                <div className="flex flex-wrap gap-2">
                  {['In Transit', 'Out for Delivery', 'Delivered', 'Delayed'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDeliveryData({...deliveryData, status})}
                      className={`text-[10px] px-3 py-1.5 rounded-full font-bold border transition-all ${
                        deliveryData.status === status 
                          ? 'bg-teal-600 border-teal-600 text-white shadow-md' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Additional Delivery Details</label>
                <textarea 
                  placeholder="Mention driver contact, intermediate stops or other details..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none transition-all"
                  value={deliveryData.additionalInfo}
                  onChange={(e) => setDeliveryData({...deliveryData, additionalInfo: e.target.value})}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={submitDeliveryUpdate}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
