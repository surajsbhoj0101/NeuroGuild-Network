import React from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const legendLabelStyle = {
  color: "#d1d5db",
  boxWidth: 10,
  boxHeight: 10,
  padding: 14,
  font: {
    family: "Roboto, sans-serif",
    size: 11,
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "68%",
  plugins: {
    legend: {
      position: "bottom",
      labels: legendLabelStyle,
    },
  },
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      ticks: {
        color: "#9ca3af",
        font: {
          family: "Roboto, sans-serif",
          size: 11,
        },
      },
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: "#9ca3af",
        font: {
          family: "Roboto, sans-serif",
          size: 11,
        },
        precision: 0,
      },
      grid: {
        color: "rgba(255,255,255,0.08)",
      },
    },
  },
};

function ChartShell({ title, subtitle, children }) {
  return (
    <div className="border border-white/10 bg-[#101827] p-4">
      <div className="mb-3 border-b border-white/8 pb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-gray-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export default function DashboardAnalyticsPanel({
  doughnutTitle,
  doughnutSubtitle,
  doughnutData,
  barTitle,
  barSubtitle,
  barData,
  insights = [],
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.2fr]">
      <div className="space-y-4">
        <ChartShell title={doughnutTitle} subtitle={doughnutSubtitle}>
          <div className="h-[250px]">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </ChartShell>

        <ChartShell
          title="Operational Queue"
          subtitle="Compact reads on what deserves attention next."
        >
          <div className="divide-y divide-white/8">
            {insights.map((insight, index) => (
              <div
                key={insight.label}
                className="grid grid-cols-[1fr_auto] gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-500">
                      0{index + 1}
                    </span>
                    <p className="text-sm font-medium text-white">{insight.label}</p>
                  </div>
                  <p className="mt-1 text-xs leading-6 text-gray-400">
                    {insight.description}
                  </p>
                </div>
                <div className="flex items-start">
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${insight.tone}`}
                  >
                    {insight.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartShell>
      </div>

      <ChartShell title={barTitle} subtitle={barSubtitle}>
        <div className="h-[360px]">
          <Bar data={barData} options={barOptions} />
        </div>
      </ChartShell>
    </div>
  );
}
