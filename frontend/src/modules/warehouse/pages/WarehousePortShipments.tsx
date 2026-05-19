import React, { useState, useEffect } from 'react';
import { getWarehousePortOrders } from '../../../services/api/warehouseService';
import { updateDeliveryDetails } from '../../../services/api/portOfferService';
import { useToast } from '../../../context/ToastContext';
import StatusBadge from '../../../components/common/StatusBadge';

const WarehousePortShipments = () => {
  const { showToast } = useToast();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    vehicleType: 'Truck',
    estimatedArrival: '',
    trackingNumber: '',
    additionalInfo: '',
    status: 'In Transit'
  });

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await getWarehousePortOrders();
      if (response.success) {
        setShipments(response.data);
      } else {
        showToast(response.message || 'Failed to fetch shipments', 'error');
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
      showToast('An error occurred while fetching shipments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleUpdateDelivery = (shipment: any) => {
    setSelectedShipment(shipment);
    setDeliveryData({
      vehicleType: shipment.deliveryDetails?.vehicleType || 'Truck',
      estimatedArrival: shipment.deliveryDetails?.estimatedArrival ? new Date(shipment.deliveryDetails.estimatedArrival).toISOString().split('T')[0] : '',
      trackingNumber: shipment.deliveryDetails?.trackingNumber || '',
      additionalInfo: shipment.deliveryDetails?.additionalInfo || '',
      status: shipment.status || 'In Transit'
    });
    setShowDeliveryModal(true);
  };

  const submitDeliveryUpdate = async () => {
    if (!selectedShipment?._id) {
      showToast('Please select a shipment first', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const response = await updateDeliveryDetails(selectedShipment._id, deliveryData);
      if (response.success) {
        showToast('Delivery updated successfully', 'success');
        setShowDeliveryModal(false);
        fetchShipments();
      } else {
        showToast(response.message || 'Failed to update delivery', 'error');
      }
    } catch (error) {
      showToast('An error occurred during update', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredShipments = shipments.filter((shipment: any) => {
    const requirementId = shipment.requirementId?.requirementId || '';
    const fishName = shipment.requirementId?.fishName || '';
    const portName = shipment.portId?.portName || shipment.portId?.name || '';
    
    const matchesSearch = requirementId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         fishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         portName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || shipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Header: title left, controls right — always in one row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-800 leading-tight">Port Inward Shipments</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and manage incoming shipments from port partners</p>
        </div>

        {/* Search + Filter — pinned to top-right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <span className="material-icons-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
            <input
              type="text"
              placeholder="Search…"
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none w-36 sm:w-52 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="approved">Confirmed</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Shipment Details</th>
                <th className="px-6 py-4">Port & Warehouse</th>
                <th className="px-6 py-4">Logistics Info</th>
                <th className="px-6 py-4">ETA & Tracking</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-4"></div>
                      <p className="text-sm font-medium">Loading shipments...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredShipments.length > 0 ? filteredShipments.map((shipment: any) => (
                <tr key={shipment._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-teal-600">{shipment.requirementId?.requirementId}</p>
                    <p className="text-xs font-bold text-slate-800 mt-1">{shipment.requirementId?.fishName}</p>
                    <p className="text-[10px] text-slate-500">{shipment.quantityOffered} KG @ ₹{shipment.offeredPrice}/KG</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons-outlined text-[14px] text-slate-400">anchor</span>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{shipment.portId?.portName || shipment.portId?.name || 'Inor Fresh Port'}</p>
                          <p className="text-[10px] text-slate-500">Mgr: {shipment.portId?.managerName || 'N/A'} • {shipment.portId?.mobile}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons-outlined text-[14px] text-slate-400">warehouse</span>
                        <p className="text-xs font-medium text-slate-600">{shipment.warehouseId?.warehouseName || shipment.warehouseId?.name || 'My Warehouse'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      {shipment.deliveryDetails ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="bg-teal-50 p-1.5 rounded-lg">
                              <span className="material-icons-outlined text-teal-600 text-sm">
                                {shipment.deliveryDetails.vehicleType === 'Plane' ? 'airplanemode_active' : 
                                 shipment.deliveryDetails.vehicleType === 'Ship' ? 'directions_boat' : 
                                 shipment.deliveryDetails.vehicleType === 'Bus' ? 'directions_bus' : 
                                 shipment.deliveryDetails.vehicleType === 'Train' ? 'train' : 'local_shipping'}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{shipment.deliveryDetails.vehicleType}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Tracking: {shipment.deliveryDetails.trackingNumber || 'N/A'}</p>
                            </div>
                          </div>
                          {shipment.deliveryDetails.additionalInfo && (
                            <p className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 italic">
                              "{shipment.deliveryDetails.additionalInfo}"
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="material-icons-outlined text-sm">pending_actions</span>
                          <span className="text-xs italic">Awaiting Port Update</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span className="material-icons-outlined text-[14px] text-teal-500">event</span>
                        {shipment.deliveryDetails ? formatDate(shipment.deliveryDetails.estimatedArrival) : formatDate(shipment.deliveryDate)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {shipment.deliveryDetails ? 'Estimated Arrival' : 'Planned Delivery'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={shipment.status === 'approved' ? 'Confirmed' : shipment.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateDelivery(shipment)}
                        className="p-2 hover:bg-teal-50 border border-transparent hover:border-teal-200 rounded-lg transition-all text-teal-600"
                        title="Update Delivery Status"
                      >
                        <span className="material-icons-outlined text-lg">local_shipping</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <span className="material-icons-outlined text-4xl block mb-2 opacity-20">inventory_2</span>
                    No active port shipments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Update Modal */}
      {showDeliveryModal && selectedShipment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-teal-600 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Shipment Delivery Update</h3>
                <p className="text-teal-100 text-[10px] font-bold uppercase tracking-wider">{selectedShipment.requirementId?.requirementId}</p>
              </div>
              <button onClick={() => setShowDeliveryModal(false)} className="hover:bg-teal-700 p-2 rounded-full transition-colors">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Product</p>
                  <p className="text-sm font-bold text-slate-800">{selectedShipment.requirementId?.fishName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Quantity</p>
                  <p className="text-sm font-bold text-slate-800">{selectedShipment.quantityOffered} KG</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Update Shipment Status</label>
                <div className="flex flex-wrap gap-2">
                  {['In Transit', 'Delivered', 'Cancelled'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDeliveryData({...deliveryData, status})}
                      className={`text-[10px] px-4 py-2 rounded-full font-bold border transition-all ${
                        deliveryData.status === status 
                          ? 'bg-teal-600 border-teal-600 text-white shadow-md' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {status === 'Delivered' ? 'Mark as Received' : status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Additional Remarks</label>
                <textarea 
                  placeholder="Add any receipt notes or remarks..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none transition-all"
                  value={deliveryData.additionalInfo}
                  onChange={(e) => setDeliveryData({...deliveryData, additionalInfo: e.target.value})}
                />
              </div>

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

export default WarehousePortShipments;
