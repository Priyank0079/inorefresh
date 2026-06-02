import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../../components/cards/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import PageTitle from '../../components/common/PageTitle';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import { getCompleteDashboard } from '../../../../services/api/portDashboardService';
import { useAuth } from '@/context/AuthContext';
import { useRefresh } from '@/context/RefreshContext';
import { useCachedFetch } from '@/hooks/useCachedFetch';

const RevenueChart = lazy(() => import('../../components/charts/RevenueChart'));

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
  const { registerRefresh, unregisterRefresh } = useRefresh();
  const [stats, setStats] = useState({
    totalRequirements: 0,
    activeOffers: 0,
    approvedOffers: 0,
    totalRevenue: 0,
    chartData: []
  });
  const [activities, setActivities] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [error, setError] = useState('');

  // Memoized fetch functions to avoid recreating on every render
  const fetchDashboardData = useCallback(async () => {
    const res = await getCompleteDashboard(token);
    return res.success ? res.data : null;
  }, [token]);

  // Short cache (20s) so counts (requirements/offers) stay fresh on revisit.
  // The navbar refresh button forces an immediate re-fetch as well.
  const { data: dashboardData, loading } = useCachedFetch(
    fetchDashboardData,
    'dashboard_complete',
    20 * 1000 // 20 seconds
  );

  // Update state when cached data arrives
  useEffect(() => {
    if (dashboardData) {
      if (dashboardData.stats) setStats(dashboardData.stats);
      if (dashboardData.activities) setActivities(dashboardData.activities);
      if (dashboardData.requirements) setRequirements(dashboardData.requirements);
    }
  }, [dashboardData]);

  // Combined refresh function that re-fetches all data
  const fetchAllData = useCallback(async () => {
    try {
      setError('');
      const res = await getCompleteDashboard(token);

      if (res.success && res.data) {
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.activities) setActivities(res.data.activities);
        if (res.data.requirements) setRequirements(res.data.requirements);
      }
    } catch (error) {
      setError(error.message || 'An error occurred while loading dashboard');
      console.error('Error fetching dashboard data:', error);
    }
  }, [token]);

  useEffect(() => {
    registerRefresh(fetchAllData);
    return () => unregisterRefresh();
  }, [fetchAllData, registerRefresh, unregisterRefresh]);

  // Note: trend badges removed — they were hardcoded fake numbers (5, 12, -2).
  const statCards = [
    {
      title: 'New Requirements',
      value: stats.totalRequirements.toString(),
      icon: 'list_alt',
      color: 'bg-blue-500',
      link: '/port/requirements',
    },
    {
      title: 'Offers Sent',
      value: (stats.activeOffers + stats.approvedOffers).toString(),
      icon: 'send',
      color: 'bg-emerald-500',
      link: '/port/offers',
    },
    {
      title: 'Active Negotiations',
      value: stats.activeOffers.toString(),
      icon: 'sync',
      color: 'bg-amber-500',
      link: '/port/offers/negotiations',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: 'payments',
      color: 'bg-teal-600',
      link: '/port/offers',
    }
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-semibold">Error Loading Dashboard</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
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
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>}>
              <RevenueChart data={stats.chartData} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 mb-6">Recent Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity, idx) => (
            <div key={idx} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 transition-hover hover:shadow-md">
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${activity.color || 'bg-blue-100 text-blue-600'}`}>
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
