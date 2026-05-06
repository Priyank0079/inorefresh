import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pending') || s.includes('new') || s.includes('delayed')) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    if (s.includes('approved') || s.includes('confirmed') || s.includes('received') || s.includes('delivered') || s.includes('closed')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    if (s.includes('rejected') || s.includes('cancelled')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (s.includes('negotiating') || s.includes('countered') || s.includes('transit') || s.includes('delivery')) {
      return 'bg-violet-100 text-violet-700 border-violet-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyles(status)} ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
