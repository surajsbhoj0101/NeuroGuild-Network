import React from "react";
import { Briefcase, TrendingUp, Award, AlertTriangle } from "lucide-react";

function ClientStats({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
          <Briefcase size={14} />
          Open Jobs
        </p>
        <p className="text-2xl font-bold text-[#14a19f]">
          {stats.openJobs || 0}
        </p>
      </div>

      <div className="backdrop-blur-md border border-blue-500/20 bg-blue-500/5 rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
          <TrendingUp size={14} />
          Active Projects
        </p>
        <p className="text-2xl font-bold text-blue-400">
          {stats.activeProjects || 0}
        </p>
      </div>

      <div className="backdrop-blur-md border border-green-500/20 bg-green-500/5 rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
          <Award size={14} />
          Completed Projects
        </p>
        <p className="text-2xl font-bold text-green-400">
          {stats.completedProjects || 0}
        </p>
      </div>

      <div className="backdrop-blur-md border border-red-500/20 bg-red-500/5 rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
          <AlertTriangle size={14} />
          Disputed Projects
        </p>
        <p className="text-2xl font-bold text-red-400">
          {stats.disputedProjects || 0}
        </p>
      </div>
    </div>
  );
}

export default ClientStats;
