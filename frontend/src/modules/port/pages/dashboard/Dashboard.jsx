import React from 'react';
import DashboardCard from '../../components/cards/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import { dummyRequirements } from '../../data/dummyRequirements';
import { dummyOffers } from '../../data/dummyOffers';

const Dashboard = () => {
  const stats = [
    { title: "Total Requirements", value: "156", icon: "assignment", color: "bg-blue-500", trend: 12 },
    { title: "Active Offers", value: "42", icon: "local_offer", color: "bg-teal-500", trend: 5 },
    { title: "Approved Offers", value: "28", icon: "verified", color: "bg-emerald-500", trend: 8 },
    { title: "Pending Orders", value: "14", icon: "shopping_cart", color: "bg-amber-500", trend: -2 },
    { title: "Completed Orders", value: "312", icon: "task_alt", color: "bg-indigo-500", trend: 15 },
    { title: "Total Revenue", value: "₹4.2M", icon: "payments", color: "bg-violet-500", trend: 20 },
    { title: "Active Products", value: "85", icon: "inventory_2", color: "bg-sky-500", trend: 4 },
    { title: "Low Stock", value: "12", icon: "warning", color: "bg-rose-500", trend: -1 }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <DashboardCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Requirements */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Recent Requirements</h3>
            <button className="text-teal-600 text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Fish Name</th>
                  <th className="px-6 py-4 font-bold">Quantity</th>
                  <th className="px-6 py-4 font-bold">Deadline</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dummyRequirements.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{req.fishName}</p>
                      <p className="text-xs text-slate-500">{req.id}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{req.quantityRequired}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{req.deadline}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Offers */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Recent Offers</h3>
            <button className="text-teal-600 text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Offer ID</th>
                  <th className="px-6 py-4 font-bold">Fish Name</th>
                  <th className="px-6 py-4 font-bold">Price</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dummyOffers.slice(0, 5).map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-teal-600">{offer.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-semibold">{offer.fishName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">₹{offer.offeredPrice}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={offer.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-6">Revenue Analysis</h3>
          <div className="h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Chart Placeholder (ApexCharts/Recharts)</p>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[
              { title: "New Requirement", desc: "Warehouse Porbandar requested 500kg Pomfret", time: "2 mins ago", icon: "assignment", color: "bg-blue-100 text-blue-600" },
              { title: "Offer Approved", desc: "Your offer OFF-001 has been approved", time: "1 hour ago", icon: "check_circle", color: "bg-emerald-100 text-emerald-600" },
              { title: "Payment Received", desc: "Order ORD-002 payment processed", time: "3 hours ago", icon: "payments", color: "bg-violet-100 text-violet-600" },
              { title: "Low Stock Alert", desc: "Kingfish stock is below 50kg", time: "5 hours ago", icon: "warning", color: "bg-rose-100 text-rose-600" }
            ].map((activity, idx) => (
              <div key={idx} className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${activity.color}`}>
                  <span className="material-icons-outlined text-xl">{activity.icon}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{activity.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{activity.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
