import React from "react";
import { DollarSign, Clock, TrendingUp, Award } from "lucide-react";

function FreelancerStats({ stats }) {
  const items = [
    {
      label: "Total Earnings",
      value: `$${(stats.totalEarnings || 0).toLocaleString()}`,
      detail: "Completed contract value",
      icon: DollarSign,
      tone: "text-emerald-300",
    },
    {
      label: "Active Projects",
      value: stats.activeProjects || 0,
      detail: "In delivery right now",
      icon: TrendingUp,
      tone: "text-sky-300",
    },
    {
      label: "Completed",
      value: stats.completedProjects || 0,
      detail: "Closed and accepted",
      icon: Award,
      tone: "text-white",
    },
    {
      label: "Pending Bids",
      value: stats.pendingBids || 0,
      detail: "Awaiting client decision",
      icon: Clock,
      tone: "text-amber-200",
    },
  ];

  return (
    <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="border border-white/10 bg-[#101827] px-4 py-3 transition-colors hover:border-white/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">
                  {item.label}
                </p>
                <p className={`mt-2 text-2xl font-semibold ${item.tone}`}>
                  {item.value}
                </p>
              </div>
              <div className="border border-white/10 bg-white/5 p-2 text-gray-300">
                <Icon size={14} />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">{item.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

export default FreelancerStats;
