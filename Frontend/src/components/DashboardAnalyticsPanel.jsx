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
    <div className="rounded-2xl border border-[#14a19f]/18 bg-[#0d1224]/58 p-5 backdrop-blur-md">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
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
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1.15fr]">
      <div className="space-y-6">
        <ChartShell title={doughnutTitle} subtitle={doughnutSubtitle}>
          <div className="h-[280px]">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </ChartShell>

        <ChartShell title="Operational Notes" subtitle="Fast reads to decide what needs attention next.">
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.label}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{insight.label}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${insight.tone}`}>
                    {insight.value}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-6 text-gray-400">{insight.description}</p>
              </div>
            ))}
          </div>
        </ChartShell>
      </div>

      <ChartShell title={barTitle} subtitle={barSubtitle}>
        <div className="h-[420px]">
          <Bar data={barData} options={barOptions} />
        </div>
      </ChartShell>
    </div>
  );
}
