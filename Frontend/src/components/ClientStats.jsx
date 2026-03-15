import React from "react";
import { Briefcase, TrendingUp, Award, AlertTriangle } from "lucide-react";

function ClientStats({ stats }) {
  const items = [
    {
      label: "Open Jobs",
      value: stats.openJobs || 0,
      detail: "Available for bidding",
      icon: Briefcase,
      tone: "text-[#8ff6f3]",
    },
    {
      label: "Active Projects",
      value: stats.activeProjects || 0,
      detail: "Currently in delivery",
      icon: TrendingUp,
      tone: "text-sky-300",
    },
    {
      label: "Completed",
      value: stats.completedProjects || 0,
      detail: "Accepted and settled",
      icon: Award,
      tone: "text-white",
    },
    {
      label: "Disputes",
      value: stats.disputedProjects || 0,
      detail: "Needs review attention",
      icon: AlertTriangle,
      tone: "text-rose-300",
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

export default ClientStats;
