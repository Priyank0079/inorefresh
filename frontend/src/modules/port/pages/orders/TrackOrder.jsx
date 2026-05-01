import React from 'react';
import PageTitle from '../../components/common/PageTitle';

const TrackOrder = () => {
  const steps = [
    { title: 'Order Confirmed', time: 'May 02, 2024 - 10:30 AM', status: 'completed' },
    { title: 'Stock Picked Up', time: 'May 03, 2024 - 02:15 PM', status: 'completed' },
    { title: 'Quality Inspection', time: 'May 03, 2024 - 04:00 PM', status: 'completed' },
    { title: 'In Transit', time: 'May 04, 2024 - 08:00 AM', status: 'active' },
    { title: 'Delivered', time: 'Estimated: May 05, 2024', status: 'pending' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageTitle 
        title="Order Tracking" 
        subtitle="Live status of your dispatched shipments"
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Order #ORD-001</h3>
            <p className="text-sm text-slate-500">Kingfish (200 KG) • Mangrol Storage</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expected Delivery</p>
            <p className="text-lg font-bold text-teal-600">May 05, 2024</p>
          </div>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 ml-[-1px]"></div>

          <div className="space-y-12">
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex items-start gap-8 pl-10">
                {/* Circle Icon */}
                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm border-4 border-white ${
                  step.status === 'completed' ? 'bg-emerald-500 text-white' :
                  step.status === 'active' ? 'bg-teal-600 text-white animate-pulse' :
                  'bg-slate-200 text-slate-400'
                }`}>
                  <span className="material-icons-outlined text-sm">
                    {step.status === 'completed' ? 'check' : 
                     step.status === 'active' ? 'local_shipping' : 'pending'}
                  </span>
                </div>

                <div>
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
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transport Details</h4>
            <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500">
                <span className="material-icons-outlined">person</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Rajesh Kumar</p>
                <p className="text-xs text-slate-500">Truck: GJ-11-AB-1234</p>
              </div>
              <button className="ml-auto p-2 text-teal-600 hover:bg-teal-50 rounded-full transition-colors">
                <span className="material-icons-outlined text-xl">call</span>
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Location</h4>
            <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
              <span className="material-icons-outlined text-teal-600">location_on</span>
              <p className="text-sm font-medium text-slate-700">Near Rajkot Highway (45km from destination)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
