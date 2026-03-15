import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar";
import ClientStats from "../../components/ClientStats";
import api from "../../utils/api.js";
import NoticeToast from "../../components/NoticeToast";
import { useAuth } from "../../contexts/AuthContext.jsx";
import DashboardAnalyticsPanel from "../../components/DashboardAnalyticsPanel.jsx";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  FilePlus2,
  Vote,
  WalletCards,
} from "lucide-react";

function ActionPanel({ title, detail, meta, icon, onClick, tone = "default" }) {
  const IconComponent = icon;
  const iconTone =
    tone === "violet"
      ? "bg-violet-500/12 text-violet-300"
      : tone === "amber"
        ? "bg-amber-500/12 text-amber-300"
        : tone === "emerald"
          ? "bg-emerald-500/12 text-emerald-300"
          : "bg-white/8 text-white";

  return (
    <button
      onClick={onClick}
      className="border border-white/10 bg-[#101827] p-4 text-left transition-colors hover:border-white/20 hover:bg-[#131d30]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`border border-white/10 p-2 ${iconTone}`}>
          <IconComponent size={16} />
        </div>
        <span className="text-xs text-gray-500">{meta}</span>
      </div>
      <h2 className="mt-4 text-sm font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-400">{detail}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-gray-200">
        Open
        <ArrowRight size={14} />
      </div>
    </button>
  );
}

function LoadingDashboard() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-3 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-24 border border-white/8 bg-white/5" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="h-96 border border-white/8 bg-white/5" />
        </div>
        <div className="space-y-4">
          <div className="h-44 border border-white/8 bg-white/5" />
          <div className="h-44 border border-white/8 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { isAuthentication } = useAuth();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    openJobs: 0,
    activeProjects: 0,
    completedProjects: 0,
    disputedProjects: 0,
  });
  const [breakdown, setBreakdown] = useState({
    open: 0,
    inProgress: 0,
    submitted: 0,
    completed: 0,
    disputed: 0,
    cancelled: 0,
    expired: 0,
  });

  useEffect(() => {
    let timer;
    if (!isAuthentication) {
      timer = setTimeout(() => {
        if (!isAuthentication) {
          setRedNotice(true);
          setNotice("Wallet not connected — redirecting to home...");
          navigate("/");
        }
      }, 1200);
    } else {
      setNotice(null);
      fetchDashboardData();
    }
    return () => clearTimeout(timer);
  }, [isAuthentication, navigate]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const response = await api.get(
        "http://localhost:5000/api/jobs/fetch-client-jobs",
        { withCredentials: true }
      );

      const categorized = response.data?.categorized || {};
      setStats({
        openJobs: categorized?.open?.length || 0,
        activeProjects: categorized?.inProgress?.length || 0,
        completedProjects: categorized?.completed?.length || 0,
        disputedProjects: categorized?.disputed?.length || 0,
      });
      setBreakdown({
        open: categorized?.open?.length || 0,
        inProgress: categorized?.inProgress?.length || 0,
        submitted: categorized?.submitted?.length || 0,
        completed: categorized?.completed?.length || 0,
        disputed: categorized?.disputed?.length || 0,
        cancelled: categorized?.cancelled?.length || 0,
        expired: categorized?.expired?.length || 0,
      });
      setRedNotice(false);
    } catch (error) {
      setRedNotice(true);
      setNotice(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const doughnutData = {
    labels: ["Open", "In Progress", "Submitted", "Disputed"],
    datasets: [
      {
        data: [
          breakdown.open,
          breakdown.inProgress,
          breakdown.submitted,
          breakdown.disputed,
        ],
        backgroundColor: [
          "rgba(109, 84, 201, 0.7)",
          "rgba(56, 189, 248, 0.72)",
          "rgba(245, 158, 11, 0.68)",
          "rgba(244, 63, 94, 0.64)",
        ],
        borderColor: "#10182d",
        borderWidth: 3,
      },
    ],
  };

  const barData = {
    labels: ["Open", "In Progress", "Submitted", "Completed", "Cancelled", "Expired"],
    datasets: [
      {
        data: [
          breakdown.open,
          breakdown.inProgress,
          breakdown.submitted,
          breakdown.completed,
          breakdown.cancelled,
          breakdown.expired,
        ],
        backgroundColor: [
          "rgba(109, 84, 201, 0.7)",
          "rgba(56, 189, 248, 0.72)",
          "rgba(245, 158, 11, 0.68)",
          "rgba(20, 161, 159, 0.78)",
          "rgba(239, 68, 68, 0.62)",
          "rgba(190, 24, 93, 0.58)",
        ],
        borderColor: "rgba(16, 24, 45, 0.95)",
        borderWidth: 1.5,
        borderRadius: 10,
      },
    ],
  };

  const insights = [
    {
      label: "Jobs waiting for review",
      value: `${breakdown.submitted}`,
      description: "Submitted work should be accepted or disputed quickly so funds do not sit idle.",
      tone: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
    },
    {
      label: "Open hiring slots",
      value: `${breakdown.open}`,
      description: "These open jobs are still collecting bids and may need faster selection.",
      tone: "bg-violet-500/15 text-violet-300 border border-violet-500/25",
    },
    {
      label: "Dispute load",
      value: `${breakdown.disputed}`,
      description: "Disputed contracts need evidence review and may flow into governance resolution.",
      tone: "bg-rose-500/15 text-rose-300 border border-rose-500/25",
    },
  ];

  const actionItems = [
    {
      title: "Manage open contracts",
      detail:
        "Review bids, accept deliveries, and close active work from one workflow surface.",
      meta: `${breakdown.inProgress} active`,
      icon: BriefcaseBusiness,
      tone: "emerald",
      onClick: () => navigate("/client/manage-jobs"),
    },
    {
      title: "Post new work",
      detail:
        "Keep the hiring funnel healthy when open inventory starts to drop or specialist demand rises.",
      meta: `${breakdown.open} open`,
      icon: FilePlus2,
      tone: "violet",
      onClick: () => navigate("/post-job"),
    },
    {
      title: "Governance and disputes",
      detail:
        "Track disputes and policy changes that can affect reviews, escrow, and payout timing.",
      meta: `${breakdown.disputed} disputed`,
      icon: Vote,
      tone: "amber",
      onClick: () => navigate("/governance"),
    },
  ];

  const queueItems = [
    {
      label: "Submitted work pending review",
      value: breakdown.submitted,
      note: "Freelancer deliveries awaiting your action.",
    },
    {
      label: "Open hiring backlog",
      value: breakdown.open,
      note: "Jobs still collecting or waiting on bids.",
    },
    {
      label: "Dispute pressure",
      value: breakdown.disputed,
      note: "Contracts that may require governance follow-through.",
    },
  ];

  return (
    <>
      <NoticeToast
        message={notice}
        isError={redNotice}
        onClose={() => setNotice(null)}
      />

      <div className="dark:bg-[#0f111d] py-4 md:py-6 flex flex-col md:flex-row gap-4 bg-[#161c32] min-w-screen min-h-screen ">
        <div className="hidden md:block">
          <SideBar />
        </div>

        <div className="min-w-0 flex-1 px-4 md:px-8 pb-8">
          <div className="mb-4 border border-white/10 bg-[#101827] px-4 py-4 md:px-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                  Client Control Surface
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-white">
                  Hiring Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                  Track hiring backlog, delivery progress, review timing, and dispute load from one operational view.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 md:w-[360px]">
                <div className="border border-white/10 bg-[#0b111b] px-3 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <WalletCards size={13} />
                    Open pipeline
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {stats.openJobs}
                  </div>
                </div>
                <div className="border border-white/10 bg-[#0b111b] px-3 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock3 size={13} />
                    Review queue
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {breakdown.submitted}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!loading ? (
            <div className="space-y-4">
              <ClientStats stats={stats} />

              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <DashboardAnalyticsPanel
                    doughnutTitle="Hiring Pipeline"
                    doughnutSubtitle="Track open hiring, active delivery, submitted work, and dispute load."
                    doughnutData={doughnutData}
                    barTitle="Contract Lifecycle"
                    barSubtitle="A full distribution of client jobs across the lifecycle."
                    barData={barData}
                    insights={insights}
                  />
                </div>

                <div className="space-y-4">
                  <div className="border border-white/10 bg-[#101827] px-4 py-4">
                    <div className="border-b border-white/8 pb-3">
                      <h2 className="text-sm font-semibold text-white">Action Queue</h2>
                      <p className="mt-1 text-xs text-gray-400">
                        The best next actions to keep hiring and settlement moving.
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {actionItems.map((item) => (
                        <ActionPanel key={item.title} {...item} />
                      ))}
                    </div>
                  </div>

                  <div className="border border-white/10 bg-[#101827] px-4 py-4">
                    <div className="border-b border-white/8 pb-3">
                      <h2 className="text-sm font-semibold text-white">Operational Snapshot</h2>
                      <p className="mt-1 text-xs text-gray-400">
                        Compact reads for queue pressure and contract flow.
                      </p>
                    </div>
                    <div className="divide-y divide-white/8">
                      {queueItems.map((item) => (
                        <div
                          key={item.label}
                          className="grid grid-cols-[1fr_auto] gap-4 py-3 first:pt-4 last:pb-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            <p className="mt-1 text-xs leading-5 text-gray-400">{item.note}</p>
                          </div>
                          <div className="text-sm font-semibold text-white">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <LoadingDashboard />
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
