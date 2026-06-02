import React, { useState, useEffect, useCallback } from 'react';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useRefresh } from '@/context/RefreshContext';
import { useToast } from '../../../../context/ToastContext';

const PortShipments = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { registerRefresh, unregisterRefresh } = useRefresh();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadInvoice = () => {
    setDownloading(true);
    showToast('Preparing invoice for download...', 'info');
    setTimeout(() => {
      setDownloading(false);
      showToast('Invoice downloaded successfully!', 'success');
    }, 1500);
  };

  const mockShipments = [
    {
      _id: '1',
      shipmentId: 'SHIP-001',
      orderId: 'ORD-2501',
      origin: 'Veraval Port, Gujarat',
      destination: 'Mumbai Port, Maharashtra',
      status: 'In Transit',
      carrier: 'Fast Shipping Co.',
      vehicleType: 'Truck',
      trackingNumber: 'TRK-2501-001',
      estimatedArrival: '2026-06-05',
      actualArrival: null,
      product: 'Pomfret Fish (Premium Grade)',
      quantity: '500 kg',
      currentLocation: 'Ahmedabad, Gujarat (Day 2 of 5)',
      progress: 40,
      createdAt: '2026-05-28',
      updatedAt: '2026-05-30'
    },
    {
      _id: '2',
      shipmentId: 'SHIP-002',
      orderId: 'ORD-2502',
      origin: 'Veraval Port, Gujarat',
      destination: 'Bangalore Port, Karnataka',
      status: 'Pending',
      carrier: 'Ocean Freight Ltd.',
      vehicleType: 'Container Ship',
      trackingNumber: 'TRK-2502-001',
      estimatedArrival: '2026-06-10',
      actualArrival: null,
      product: 'Mackerel Fish (Standard Grade)',
      quantity: '1000 kg',
      currentLocation: 'Port Awaiting Dispatch',
      progress: 5,
      createdAt: '2026-05-29',
      updatedAt: '2026-05-29'
    },
    {
      _id: '3',
      shipmentId: 'SHIP-003',
      orderId: 'ORD-2503',
      origin: 'Veraval Port, Gujarat',
      destination: 'Delhi Distribution Center',
      status: 'Delivered',
      carrier: 'Premium Logistics',
      vehicleType: 'Refrigerated Truck',
      trackingNumber: 'TRK-2503-001',
      estimatedArrival: '2026-05-30',
      actualArrival: '2026-05-30',
      product: 'Surmai Fish (Premium Grade)',
      quantity: '300 kg',
      currentLocation: 'Delhi Distribution Center',
      progress: 100,
      createdAt: '2026-05-26',
      updatedAt: '2026-05-30'
    },
    {
      _id: '4',
      shipmentId: 'SHIP-004',
      orderId: 'ORD-2504',
      origin: 'Veraval Port, Gujarat',
      destination: 'Kolkata Port, West Bengal',
      status: 'In Transit',
      carrier: 'Express Freight',
      vehicleType: 'Truck',
      trackingNumber: 'TRK-2504-001',
      estimatedArrival: '2026-06-08',
      actualArrival: null,
      product: 'Hilsa Fish (Premium Grade)',
      quantity: '600 kg',
      currentLocation: 'Madhya Pradesh (Day 3 of 6)',
      progress: 50,
      createdAt: '2026-05-27',
      updatedAt: '2026-05-30'
    },
    {
      _id: '5',
      shipmentId: 'SHIP-005',
      orderId: 'ORD-2505',
      origin: 'Veraval Port, Gujarat',
      destination: 'Chennai Port, Tamil Nadu',
      status: 'Cancelled',
      carrier: 'Cancelled Logistics',
      vehicleType: 'N/A',
      trackingNumber: 'TRK-2505-001',
      estimatedArrival: '2026-06-02',
      actualArrival: null,
      product: 'Kingfish (Premium Grade)',
      quantity: '400 kg',
      currentLocation: 'Cancelled',
      progress: 0,
      createdAt: '2026-05-25',
      updatedAt: '2026-05-29'
    }
  ];

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      // Simulating API call - replace with actual API when available
      await new Promise(resolve => setTimeout(resolve, 500));
      setShipments(mockShipments);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  useEffect(() => {
    registerRefresh(fetchShipments);
    return () => unregisterRefresh();
  }, [fetchShipments, registerRefresh, unregisterRefresh]);

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.shipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Transit': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getProgressColor = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-emerald-500';
      case 'In Transit': return 'bg-blue-500';
      case 'Pending': return 'bg-amber-500';
      case 'Cancelled': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

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
        title="Port Shipment"
        subtitle="Track and manage all your shipments"
        actions={
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search by ID, tracking number..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none w-full transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white border-slate-200 text-slate-600 hover:shadow-sm'}`}
              >
                <span className="material-icons-outlined text-lg">filter_list</span>
                <span className="hidden sm:inline">{statusFilter === 'All' ? 'Status' : statusFilter}</span>
                <span className="sm:hidden">Filter</span>
              </button>

              {showFilters && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowFilters(false)} />
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {['All', 'Pending', 'In Transit', 'Delivered', 'Cancelled'].map((status) => (
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
                </>
              )}
            </div>
          </div>
        }
      />

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Shipment ID</th>
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-6 py-4 font-bold">Tracking</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Current Location</th>
                <th className="px-6 py-4 font-bold">ETA</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShipments.map((shipment) => (
                <tr key={shipment._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-teal-600">{shipment.shipmentId}</p>
                    <p className="text-xs text-slate-500">{shipment.orderId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{shipment.product}</p>
                    <p className="text-xs text-slate-500">{shipment.quantity}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{shipment.trackingNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(shipment.status)}`}>
                      {shipment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{shipment.currentLocation}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(shipment.estimatedArrival).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedShipment(shipment)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-sm italic">No shipments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredShipments.map((shipment) => (
          <div key={shipment._id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-teal-600">{shipment.shipmentId}</p>
                <p className="text-xs text-slate-500">{shipment.orderId}</p>
              </div>
              <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(shipment.status)}`}>
                {shipment.status}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium">Product</p>
                <p className="text-sm font-semibold text-slate-800">{shipment.product}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Current Location</p>
                <p className="text-sm text-slate-700">{shipment.currentLocation}</p>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">ETA</p>
                  <p className="text-sm font-semibold text-slate-800">{new Date(shipment.estimatedArrival).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">Tracking</p>
                  <p className="text-xs font-mono text-slate-600">{shipment.trackingNumber}</p>
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(shipment.status)}`}
                style={{ width: `${shipment.progress}%` }}
              ></div>
            </div>

            <button
              onClick={() => setSelectedShipment(shipment)}
              className="w-full py-2 bg-teal-50 text-teal-600 rounded-lg text-xs font-bold hover:bg-teal-100 transition-all"
            >
              View Full Details
            </button>
          </div>
        ))}
        {filteredShipments.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center border border-dashed border-slate-200">
            <p className="text-slate-400 text-sm italic">No shipments found</p>
          </div>
        )}
      </div>

      {/* Shipment Details Modal */}
      {selectedShipment && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedShipment(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Shipment Details</h2>
              <button
                onClick={() => setSelectedShipment(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Shipment ID</p>
                  <p className="text-lg font-bold text-teal-600 mt-1">{selectedShipment.shipmentId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Order ID</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{selectedShipment.orderId}</p>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800">Shipment Status</h3>
                <div className="flex items-center gap-3">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(selectedShipment.status)}`}>
                    {selectedShipment.status}
                  </span>
                  <span className="text-sm text-slate-600">Last updated: {new Date(selectedShipment.updatedAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(selectedShipment.status)}`}
                    style={{ width: `${selectedShipment.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-600 text-right">{selectedShipment.progress}% Complete</p>
              </div>

              {/* Location */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Current Location</p>
                <p className="text-base font-semibold text-slate-800">{selectedShipment.currentLocation}</p>
              </div>

              {/* Route Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-blue-50 p-4 rounded-xl">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">Origin</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedShipment.origin}</p>
                </div>
                <div className="space-y-2 bg-emerald-50 p-4 rounded-xl">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Destination</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedShipment.destination}</p>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800">Product Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Product</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{selectedShipment.product}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Quantity</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{selectedShipment.quantity}</p>
                  </div>
                </div>
              </div>

              {/* Carrier & Vehicle */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800">Carrier Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Carrier</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{selectedShipment.carrier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Vehicle Type</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{selectedShipment.vehicleType}</p>
                  </div>
                </div>
              </div>

              {/* Tracking & Timeline */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                <h3 className="font-bold text-slate-800">Tracking Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Tracking Number:</span>
                    <span className="text-sm font-mono font-bold text-teal-600">{selectedShipment.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Shipped Date:</span>
                    <span className="text-sm font-semibold text-slate-800">{new Date(selectedShipment.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Estimated Arrival:</span>
                    <span className="text-sm font-semibold text-slate-800">{new Date(selectedShipment.estimatedArrival).toLocaleDateString('en-IN')}</span>
                  </div>
                  {selectedShipment.actualArrival && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Actual Arrival:</span>
                      <span className="text-sm font-semibold text-emerald-600">{new Date(selectedShipment.actualArrival).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setSelectedShipment(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={handleDownloadInvoice}
                  disabled={downloading}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <span className="material-icons-outlined text-lg">download</span>
                      Download Invoice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortShipments;
