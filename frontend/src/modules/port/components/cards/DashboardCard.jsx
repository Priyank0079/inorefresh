import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardCard = ({ title, value, icon, color, trend, link }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => link && navigate(link)}
      className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group ${link ? 'cursor-pointer hover:border-teal-200' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform`}>
          <span className="material-icons-outlined text-2xl">{icon}</span>
        </div>
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : trend < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
            {trend > 0 ? '+' : ''}{trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
    </div>
  );
};

export default DashboardCard;
