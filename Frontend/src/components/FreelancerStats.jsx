import React from 'react';
import { DollarSign, Clock, TrendingUp, Award } from 'lucide-react';

function FreelancerStats({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {/* Total Earnings */}
      <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
          <DollarSign size={14} />
          Total Earnings
        </p>
        <p className="text-2xl font-bold text-[#14a19f]">${(stats.totalEarnings || 0).toLocaleString()}</p>
      </div>

      {/* Active Projects */}
      <div className="backdrop-blur-md border border-blue-500/20 bg-blue-500/5 rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
          <TrendingUp size={14} />
          Active Projects
        </p>
        <p className="text-2xl font-bold text-blue-400">{stats.activeProjects || 0}</p>
      </div>

      {/* Completed Projects */}
      <div className="backdrop-blur-md border border-green-500/20 bg-green-500/5 rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
          <Award size={14} />
          Completed
        </p>
        <p className="text-2xl font-bold text-green-400">{stats.completedProjects || 0}</p>
      </div>

      {/* Pending Proposals */}
      <div className="backdrop-blur-md border border-purple-500/20 bg-purple-500/5 rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
          <Clock size={14} />
          Pending Bids
        </p>
        <p className="text-2xl font-bold text-purple-400">{stats.pendingBids || 0}</p>
      </div>
    </div>
  );
}

export default FreelancerStats;
