import React from 'react';

const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-slate-200 rounded-xl h-32 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-300 rounded-lg"></div>
              <div className="w-12 h-6 bg-slate-300 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-300 rounded w-3/4"></div>
              <div className="h-6 bg-slate-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tables & Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Requirements Table */}
        <div className="bg-slate-50 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <div className="h-6 bg-slate-300 rounded w-1/3"></div>
              <div className="h-4 bg-slate-300 rounded w-1/6"></div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="flex gap-4 pb-4 border-b border-slate-100">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-300 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-300 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-slate-300 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Skeleton */}
        <div className="bg-slate-50 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 bg-slate-300 rounded w-1/3"></div>
            <div className="h-8 bg-slate-300 rounded w-1/4"></div>
          </div>
          <div className="h-64 bg-slate-300 rounded"></div>
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="bg-slate-50 rounded-xl p-6">
        <div className="h-6 bg-slate-300 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="flex gap-4 p-4 bg-white rounded-lg border border-slate-200">
              <div className="w-10 h-10 bg-slate-300 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-300 rounded w-3/4"></div>
                <div className="h-3 bg-slate-300 rounded w-full"></div>
                <div className="h-2 bg-slate-300 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
