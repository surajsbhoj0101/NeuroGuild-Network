import React from 'react';
import { TrendingUp, Users, DollarSign, CheckCircle } from 'lucide-react';

function JobStats({ jobs }) {
  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'active').length,
    completedJobs: jobs.filter(j => j.status === 'completed').length,
    totalBids: jobs.reduce((sum, j) => sum + (j.bidCount || 0), 0),
    totalBudget: jobs.reduce((sum, j) => sum + (parseFloat(j.budget) || 0), 0),
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {/* Total Jobs */}
      <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1">Total Jobs</p>
        <p className="text-2xl font-bold text-white">{stats.totalJobs}</p>
      </div>

      {/* Active Jobs */}
      <div className="backdrop-blur-md border border-green-500/20 bg-green-500/5 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-400">Active</p>
          <TrendingUp size={14} className="text-green-400" />
        </div>
        <p className="text-2xl font-bold text-green-400">{stats.activeJobs}</p>
      </div>

      {/* Completed Jobs */}
      <div className="backdrop-blur-md border border-blue-500/20 bg-blue-500/5 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-400">Completed</p>
          <CheckCircle size={14} className="text-blue-400" />
        </div>
        <p className="text-2xl font-bold text-blue-400">{stats.completedJobs}</p>
      </div>

      {/* Total Bids */}
      <div className="backdrop-blur-md border border-purple-500/20 bg-purple-500/5 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-400">Total Bids</p>
          <Users size={14} className="text-purple-400" />
        </div>
        <p className="text-2xl font-bold text-purple-400">{stats.totalBids}</p>
      </div>

      {/* Total Budget */}
      <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-400">Total Budget</p>
          <DollarSign size={14} className="text-[#14a19f]" />
        </div>
        <p className="text-2xl font-bold text-[#14a19f]">${stats.totalBudget.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default JobStats;
