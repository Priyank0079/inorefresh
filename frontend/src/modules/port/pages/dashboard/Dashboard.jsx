import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import DashboardCard from '../../components/cards/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import PageTitle from '../../components/common/PageTitle';
import { getDashboardStats, getRecentActivities, getRecentRequirements } from '../../../../services/api/portDashboardService';
import { useAuth } from '@/context/AuthContext';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalRequirements: 0,
    activeOffers: 0,
    approvedOffers: 0,
    totalRevenue: 0,
    chartData: []
  });
  const [activities, setActivities] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, activityRes, reqRes] = await Promise.all([
          getDashboardStats(token),
          getRecentActivities(token),
          getRecentRequirements(token)
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (activityRes.success) setActivities(activityRes.data);
        if (reqRes.success) setRequirements(reqRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const statCards = [
    { 
      title: 'Active Requirements', 
      value: stats.totalRequirements.toString(), 
      icon: 'list_alt', 
      color: 'bg-blue-500', 
      trend: '+5%', 
      isPositive: true 
    },
    { 
      title: 'Offers Sent', 
      value: (stats.activeOffers + stats.approvedOffers).toString(), 
      icon: 'send', 
      color: 'bg-emerald-500', 
      trend: '+12%', 
      isPositive: true 
    },
    { 
      title: 'Active Negotiations', 
      value: stats.activeOffers.toString(), 
      icon: 'sync', 
      color: 'bg-amber-500', 
      trend: '-2%', 
      isPositive: false 
    },
    { 
      title: 'Total Revenue', 
      value: `₹${stats.totalRevenue.toLocaleString()}`, 
      icon: 'payments', 
      color: 'bg-teal-600', 
      trend: '+18%', 
      isPositive: true 
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <DashboardCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Available Requirements</h3>
            <button onClick={() => navigate('/port/requirements')} className="text-teal-600 text-sm font-semibold hover:underline">View All</button>
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
                {requirements.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{req.fishName}</p>
                      <p className="text-xs text-slate-500">{req.requirementId}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{req.quantityRequired} {req.unit}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(req.deadline)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))}
                {requirements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm italic">No requirements found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Analysis Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[350px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Revenue Analysis</h3>
            <select className="text-xs border-none bg-slate-50 rounded-md px-2 py-1 outline-none text-slate-500 font-medium">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={30}>
                  {stats.chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === stats.chartData.length - 1 ? '#0d9488' : '#94a3b8'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 mb-6">Recent Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity, idx) => (
            <div key={idx} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 transition-hover hover:shadow-md">
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${activity.color}`}>
                <span className="material-icons-outlined text-xl">{activity.icon}</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{activity.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{activity.desc}</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                  {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-400 text-sm italic">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
