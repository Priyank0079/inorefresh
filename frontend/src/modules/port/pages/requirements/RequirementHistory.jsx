import React, { useState, useEffect } from 'react';
import PageTitle from '../../components/common/PageTitle';
import StatusBadge from '../../components/common/StatusBadge';
import { getPortRequirements } from '@/services/api/portRequirementService';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const RequirementHistory = () => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await getPortRequirements({
          status: ['Closed', 'Expired', 'Cancelled', 'Negotiating'] // Show non-Open ones
        });
        if (res.success) {
          setRequirements(res.data);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Requirement History" 
        subtitle="Archive of all past warehouse requirements and their outcomes"
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Req ID</th>
                <th className="px-6 py-4 font-bold">Fish Name</th>
                <th className="px-6 py-4 font-bold">Warehouse</th>
                <th className="px-6 py-4 font-bold">Quantity</th>
                <th className="px-6 py-4 font-bold">Closed Date</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    Loading history...
                  </td>
                </tr>
              ) : requirements.map((req) => (
                <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-teal-600">{req.requirementId}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{req.fishName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{req.warehouseId?.warehouseName || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-semibold">{req.quantityRequired} {req.unit}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(req.updatedAt)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                </tr>
              ))}
              {!loading && requirements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm italic">No history found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RequirementHistory;
