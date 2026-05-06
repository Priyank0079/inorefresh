import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageTitle from '../../components/common/PageTitle';
import { getOfferById } from '../../../../services/api/portOfferService';
import { useToast } from '../../../../context/ToastContext';

const TrackOrder = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const response = await getOfferById(id);
        if (response.success) {
          setOrder(response.data);
        } else {
          showToast(response.message || 'Failed to fetch order details', 'error');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        showToast('An error occurred while fetching order details', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetails();
      
      // Real-time updates
      const socket = window.socket;
      if (socket) {
        socket.on('delivery-update', (data) => {
          if (data.offerId === id) {
            fetchOrderDetails();
          }
        });
        return () => socket.off('delivery-update');
      }
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading tracking data...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Order Not Found</h3>
        <p className="text-slate-500">The order you are looking for does not exist or you don't have permission to view it.</p>
      </div>
    );
  }

  const getStatusInfo = () => {
    const s = order.status;
    const updatedAt = new Date(order.updatedAt).toLocaleString();
    const eta = order.deliveryDetails?.estimatedArrival ? new Date(order.deliveryDetails.estimatedArrival).toLocaleDateString() : new Date(order.deliveryDate).toLocaleDateString();

    const steps = [
      { 
        title: 'Order Confirmed', 
        time: updatedAt, 
        status: ['approved', 'In Transit', 'Out for Delivery', 'Delivered'].includes(s) ? 'completed' : 'pending' 
      },
      { 
        title: 'Stock Picked Up', 
        time: ['In Transit', 'Out for Delivery', 'Delivered'].includes(s) ? updatedAt : 'Pending', 
        status: ['In Transit', 'Out for Delivery', 'Delivered'].includes(s) ? 'completed' : (s === 'approved' ? 'pending' : 'pending') 
      },
      { 
        title: 'In Transit', 
        time: ['Out for Delivery', 'Delivered'].includes(s) ? updatedAt : `Estimated: ${eta}`, 
        status: ['Out for Delivery', 'Delivered'].includes(s) ? 'completed' : (s === 'In Transit' ? 'active' : 'pending') 
      },
      { 
        title: 'Delivered', 
        time: s === 'Delivered' ? updatedAt : `Estimated: ${eta}`, 
        status: s === 'Delivered' ? 'completed' : 'pending' 
      }
    ];

    return steps;
  };

  const steps = getStatusInfo();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageTitle 
        title="Order Tracking" 
        subtitle="Live status of your dispatched shipments"
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Order #{order.requirementId?.requirementId || 'N/A'}</h3>
            <p className="text-sm text-slate-500">{order.requirementId?.fishName} ({order.quantityOffered} KG) • {order.warehouseId?.warehouseName || order.warehouseId?.name}</p>
          </div>
          <div className="bg-teal-50 px-4 py-2 rounded-xl border border-teal-100">
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">Expected Delivery</p>
            <p className="text-lg font-bold text-teal-700">
              {order.deliveryDetails?.estimatedArrival ? new Date(order.deliveryDetails.estimatedArrival).toLocaleDateString() : new Date(order.deliveryDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 ml-[-1px]"></div>

          <div className="space-y-12">
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex items-start gap-8 pl-10">
                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm border-4 border-white transition-all duration-500 ${
                  step.status === 'completed' ? 'bg-emerald-500 text-white' :
                  step.status === 'active' ? 'bg-teal-600 text-white' :
                  'bg-slate-200 text-slate-400'
                }`}>
                  <span className="material-icons-outlined text-sm">
                    {step.status === 'completed' ? 'check' : 
                     step.status === 'active' ? 'local_shipping' : 'pending'}
                  </span>
                </div>

                <div className="animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  <h4 className={`text-sm font-bold ${step.status === 'pending' ? 'text-slate-400' : 'text-slate-800'}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Warehouse Contact</h4>
            <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500">
                <span className="material-icons-outlined">person</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{order.warehouseId?.managerName || 'Manager'}</p>
                <p className="text-xs text-slate-500">{order.warehouseId?.mobile || 'N/A'}</p>
              </div>
              {order.warehouseId?.mobile && (
                <a href={`tel:${order.warehouseId.mobile}`} className="ml-auto p-2 text-teal-600 hover:bg-teal-50 rounded-full transition-colors">
                  <span className="material-icons-outlined text-xl">call</span>
                </a>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Warehouse Address</h4>
            <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
              <span className="material-icons-outlined text-teal-600">location_on</span>
              <p className="text-sm font-medium text-slate-700">{order.warehouseId?.address}, {order.warehouseId?.city}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
