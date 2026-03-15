import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MdSecurity } from "react-icons/md";
import { GiBrain } from "react-icons/gi";
import { RiExchangeDollarLine } from "react-icons/ri";
import { BsPeople } from "react-icons/bs";
import { useAccount } from "wagmi";
import Snowfall from "react-snowfall";
import Logout from "./components/Logout.jsx";
import CustomConnectButton from "./components/CustomConnectButton.jsx";
import Login from "./components/Login";
import NoticeToast from "./components/NoticeToast.jsx";
import api from "./utils/api.js";
import logo from "./assets/images/logo.png";
import "./index.css";
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  Bot,
  Coins,
  Gavel,
  LineChart,
  MessageSquareText,
  Sparkles,
  Workflow,
} from "lucide-react";

const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
const robotoStyle = { fontFamily: "Roboto, sans-serif" };

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      <div className="inline-flex items-center gap-2 rounded-md border border-[#162036] bg-[#111827]/70 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-gray-400">
        <Sparkles size={12} className="text-[#14a19f]" />
        {eyebrow}
      </div>
      <h2
        style={orbitronStyle}
        className="mt-3 text-2xl md:text-3xl font-bold text-white"
      >
        {title}
      </h2>
      <p style={robotoStyle} className="mt-3 max-w-3xl text-sm md:text-base text-gray-300 leading-7">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, description, detail }) {
  const IconComponent = icon;

  return (
    <div className="rounded-xl border border-[#162036] bg-[#0f121e]/95 p-5 transition-all duration-300 hover:border-[#1ecac7]/30 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#111827] p-2 text-[#14a19f]">
          <IconComponent size={16} />
        </div>
        <h3 style={orbitronStyle} className="text-sm font-semibold text-white">
          {title}
        </h3>
      </div>
      <p style={robotoStyle} className="mt-3 text-sm text-gray-300 leading-6">
        {description}
      </p>
      <p style={robotoStyle} className="mt-3 text-xs uppercase tracking-[0.12em] text-gray-500">
        {detail}
      </p>
    </div>
  );
}

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-lg border border-[#162036] bg-[#0f121e]/95 p-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>
      <p style={orbitronStyle} className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>
      <p style={robotoStyle} className="mt-2 text-sm text-gray-400">
        {note}
      </p>
    </div>
  );
}

function PulseCard({ label, value, note, tone = "default" }) {
  const toneClasses = {
    default: "text-[#8ff6f3] border-[#162036]",
    success: "text-[#79f0b5] border-[#1e3a33]",
    warning: "text-[#f3d47a] border-[#3a3220]",
  };

  return (
    <div className="rounded-lg border border-[#162036] bg-[#0f121e]/95 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">
          {label}
        </p>
        <span
          className={`rounded-md border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${
            toneClasses[tone] || toneClasses.default
          }`}
        >
          Live
        </span>
      </div>
      <p style={orbitronStyle} className="mt-3 text-2xl font-bold text-white">
        {value}
      </p>
      <p style={robotoStyle} className="mt-2 text-sm text-gray-400">
        {note}
      </p>
    </div>
  );
}

function WorkflowStep({ number, title, description }) {
  return (
    <div className="grid grid-cols-[44px_1fr] gap-4 rounded-xl border border-[#162036] bg-[#0f121e]/95 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#111827] text-sm font-semibold text-[#14a19f]">
        {number}
      </div>
      <div>
        <h3 style={orbitronStyle} className="text-sm font-semibold text-white">
          {title}
        </h3>
        <p style={robotoStyle} className="mt-2 text-sm text-gray-300 leading-6">
          {description}
        </p>
      </div>
    </div>
  );
}

function MiniSurface({ title, meta, rows }) {
  return (
    <div className="rounded-xl border border-[#162036] bg-[#0f121e]/95 overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#162036] px-4 py-3">
        <div>
          <h3 style={orbitronStyle} className="text-sm font-semibold text-white">
            {title}
          </h3>
          <p className="mt-1 text-xs text-gray-500">{meta}</p>
        </div>
        <div className="rounded-md bg-[#111827] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#14a19f]">
          Live
        </div>
      </div>
      <div className="divide-y divide-[#162036] px-4">
        {rows.map((row) => (
          <div
            key={row.title}
            className="grid grid-cols-[1.2fr_0.7fr_0.8fr] gap-3 py-3 text-sm"
          >
            <div>
              <p className="font-medium text-white">{row.title}</p>
              <p className="mt-1 text-xs text-gray-500">{row.subtitle}</p>
            </div>
            <p className="text-gray-300">{row.owner}</p>
            <p className="text-right text-xs font-medium text-[#8ff6f3]">
              {row.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({ items }) {
  return (
    <div className="rounded-xl border border-[#162036] bg-[#0f121e]/95 overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#162036] px-4 py-3">
        <div>
          <h3 style={orbitronStyle} className="text-sm font-semibold text-white">
            Network activity
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Recent movement across hiring, reviews, and governance
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#8ff6f3]">
          <span className="h-2 w-2 rounded-full bg-[#14a19f] shadow-[0_0_10px_rgba(20,161,159,0.7)]" />
          Live
        </div>
      </div>
      <div className="divide-y divide-[#162036] px-4">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-xs text-gray-500">{item.detail}</p>
              </div>
              <span className="rounded-md bg-[#111827] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8ff6f3]">
                {item.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SurfaceSkeleton() {
  return (
    <div className="rounded-xl border border-[#162036] bg-[#0f121e]/95 p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-[#182033]" />
        <div className="h-14 rounded bg-[#121827]" />
        <div className="h-14 rounded bg-[#121827]" />
        <div className="h-14 rounded bg-[#121827]" />
      </div>
    </div>
  );
}

export default function App() {
  const { isConnected } = useAccount();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [homepageSnapshot, setHomepageSnapshot] = useState(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [snapshotLoadedAt, setSnapshotLoadedAt] = useState(null);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    let cancelled = false;

    async function loadHomepageSnapshot() {
      try {
        const response = await api.get("/api/jobs/homepage-snapshot", {
          withCredentials: false,
        });

        if (!cancelled && response.data?.success) {
          setHomepageSnapshot(response.data);
          setSnapshotLoadedAt(new Date());
        }
      } catch (error) {
        console.warn("homepage snapshot unavailable:", error?.message);
      } finally {
        if (!cancelled) {
          setLoadingSnapshot(false);
        }
      }
    }

    loadHomepageSnapshot();

    return () => {
      cancelled = true;
    };
  }, []);

  const workflow = [
    {
      number: "01",
      title: "Clients post work and shortlist bids",
      description:
        "Jobs open with transparent scope, funding expectations, and delivery timelines so both sides start from a clearer contract surface.",
    },
    {
      number: "02",
      title: "Funds lock in escrow when a bid is accepted",
      description:
        "The selected freelancer starts with capital committed on-chain, reducing ghosting and payment ambiguity before work begins.",
    },
    {
      number: "03",
      title: "Freelancers submit proof and build credential history",
      description:
        "Delivery proofs, completed contracts, and quiz-based skill verification contribute to a more credible professional profile.",
    },
    {
      number: "04",
      title: "Disputes route into governance instead of private moderation",
      description:
        "When work goes sideways, the product has a native governance path for review rather than relying only on centralized support decisions.",
    },
  ];

  const features = [
    {
      icon: Bot,
      title: "AI-assisted match quality",
      description:
        "Surface more relevant gigs and talent faster using skill, profile, and context-aware signals.",
      detail: "Discovery",
    },
    {
      icon: Coins,
      title: "Escrow-backed contracts",
      description:
        "Move from vague promises to contract-funded work acceptance with visible settlement logic.",
      detail: "Payments",
    },
    {
      icon: BadgeCheck,
      title: "Skill SBT issuance",
      description:
        "Use quiz verification plus council minting to make expertise portable and verifiable.",
      detail: "Credentials",
    },
    {
      icon: Gavel,
      title: "Governance dispute handling",
      description:
        "Escalate disputes through protocol-native review instead of opaque moderation queues.",
      detail: "Resolution",
    },
    {
      icon: MessageSquareText,
      title: "Shared workspace messaging",
      description:
        "Keep clients and freelancers aligned around contracts, delivery, and evidence in one place.",
      detail: "Collaboration",
    },
    {
      icon: LineChart,
      title: "Operational visibility",
      description:
        "Track jobs, review load, earnings, queue pressure, and governance activity through dashboard surfaces.",
      detail: "Analytics",
    },
  ];

  const useCases = [
    {
      title: "Founder hiring a frontend specialist",
      description:
        "Post a scoped React build, lock funds once the right bid is selected, and review work against a proof-based workflow.",
    },
    {
      title: "Freelancer proving Web3 capability",
      description:
        "Complete a skill test, build completed work history, and show council-issued credentials directly on profile surfaces.",
    },
    {
      title: "DAO contributor handling a dispute",
      description:
        "Escalate delivery disagreements into governance instead of losing context in private support conversations.",
    },
  ];

  const ecosystems = [
    "Wallet authentication",
    "On-chain escrow contracts",
    "Governance workflows",
    "Skill SBT credentialing",
    "IPFS proof storage",
    "Real-time messaging",
  ];

  const testimonials = [
    {
      quote:
        "The biggest difference is that the product treats contract operations like software, not like a support problem.",
      author: "Arjun Rao",
      role: "Product Lead, Chainframe Studio",
    },
    {
      quote:
        "Credential status, escrow, and dispute visibility all feel connected. That makes trust much easier to establish.",
      author: "Maya Chen",
      role: "Freelance Frontend Engineer",
    },
  ];

  const fallbackClientRows = [
    {
      title: "AI Job Match — Frontend React",
      subtitle: "Escrow funded · 3 milestones",
      owner: "Aster Labs",
      status: "IN PROGRESS",
    },
    {
      title: "Node API hardening sprint",
      subtitle: "5 bids · shortlist ready",
      owner: "Chainframe",
      status: "HIRING",
    },
    {
      title: "Solidity reasoning assessment",
      subtitle: "Quiz passed · council mint queue",
      owner: "Credentialing",
      status: "REVIEW",
    },
  ];

  const fallbackGovernanceRows = [
    {
      title: "Dispute resolution #18",
      subtitle: "Evidence uploaded",
      owner: "DAO vote",
      status: "VOTING",
    },
    {
      title: "Treasury policy update",
      subtitle: "Fee distribution review",
      owner: "Protocol",
      status: "QUEUE",
    },
    {
      title: "Skill registry update",
      subtitle: "Council approval flow",
      owner: "Governance",
      status: "READY",
    },
  ];

  const liveStats = homepageSnapshot?.stats;
  const liveClientRows = homepageSnapshot?.surfaces?.clientRows;
  const liveGovernanceRows = homepageSnapshot?.surfaces?.governanceRows;

  const clientRows = Array.isArray(liveClientRows) && liveClientRows.length
    ? liveClientRows
    : fallbackClientRows;
  const governanceRows = Array.isArray(liveGovernanceRows) && liveGovernanceRows.length
    ? liveGovernanceRows
    : fallbackGovernanceRows;
  const livePulse = [
    {
      label: "Open demand",
      value:
        liveStats?.openHiringDemand != null
          ? `${liveStats.openHiringDemand}`
          : "3",
      note: "Jobs currently open for bidding in the marketplace.",
      tone: "default",
    },
    {
      label: "Submitted reviews",
      value:
        liveStats?.submittedReviews != null
          ? `${liveStats.submittedReviews}`
          : "2",
      note: "Deliveries waiting for client review or dispute action.",
      tone: "warning",
    },
    {
      label: "Disputes active",
      value: liveStats?.disputes != null ? `${liveStats.disputes}` : "1",
      note: "Cases currently moving through governance workflows.",
      tone: "success",
    },
  ];
  const activityFeedItems = [
    {
      title: clientRows[0]?.title || "Frontend React role received new hiring activity",
      detail:
        clientRows[0]?.subtitle ||
        "Marketplace workspace activity updated from live data.",
      tag: clientRows[0]?.status || "HIRING",
    },
    {
      title: governanceRows[0]?.title || "Governance resolution moved forward",
      detail:
        governanceRows[0]?.subtitle ||
        "Proposal and evidence state changed inside governance.",
      tag: governanceRows[0]?.status || "VOTING",
    },
    {
      title:
        liveStats?.skillCredentials != null
          ? `${liveStats.skillCredentials} skill credentials have been minted`
          : "Credential issuance is active",
      detail:
        "Assessment and council review continue to update freelancer verification status.",
      tag: "CREDENTIALS",
    },
  ];
  const refreshLabel = snapshotLoadedAt
    ? `Updated ${snapshotLoadedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "Using fallback snapshot";

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0f1422] text-white">
      <Login
        setLoadingUser={setLoadingUser}
        setNotice={setNotice}
        setRedNotice={setRedNotice}
      />
      <Logout />

      {loadingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-t-[#14a19f] border-gray-700 rounded-full animate-spin"></div>
            <div className="text-sm text-white">Authenticating…</div>
          </div>
        </div>
      )}

      {/* <Snowfall snowflakeCount={120} /> */}

      <div className="pointer-events-none absolute -left-32 -top-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#122033] via-[#0f2540] to-[#08101a] opacity-40 blur-3xl"></div>
      <div className="pointer-events-none absolute right-[-120px] top-48 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl"></div>

      <NoticeToast
        message={notice}
        isError={redNotice}
        onClose={() => setNotice(null)}
      />

      <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
        <Reveal>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#162036] bg-[#111827]/70 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-gray-400">
                <span className="h-2 w-2 rounded-full bg-[#14a19f] shadow-[0_0_10px_rgba(20,161,159,0.7)]" />
                Live protocol workspace
              </div>
              <div className="rounded-md border border-[#162036] bg-[#0f121e]/90 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-gray-500">
                {loadingSnapshot ? "Syncing snapshot" : refreshLabel}
              </div>
            </div>
            <h1
              style={orbitronStyle}
              className="text-4xl md:text-5xl font-extrabold"
            >
              NeuroGuild — decentralized freelancing, reimagined
            </h1>

            <p style={robotoStyle} className="text-gray-300 max-w-xl leading-7">
              Match with verified talent, escrow payments on-chain, and build
              reputation using skill SBTs. A trust-minimized marketplace for the
              future of work.
            </p>

            <div className="mt-6 flex flex-col gap-4">
              {!isConnected ? (
                <div className="text-md text-blue-400">
                  Connect Wallet to Continue
                </div>
              ) : (
                <div className="text-sm text-green-400">
                  Wallet connected Successfully
                </div>
              )}

              <div>
                <CustomConnectButton />
              </div>
            </div>

            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  iconWrap: GiBrain,
                  iconClass: "text-cyan-300",
                  title: "AI-Powered Matches",
                  body: "Smart discovery of best-fit gigs and freelancers.",
                },
                {
                  iconWrap: MdSecurity,
                  iconClass: "text-yellow-400",
                  title: "On-chain Escrow",
                  body: "Payments locked until delivery.",
                },
                {
                  iconWrap: RiExchangeDollarLine,
                  iconClass: "text-green-300",
                  title: "Transparent Fees",
                  body: "Low predictable platform overhead.",
                },
                {
                  iconWrap: BsPeople,
                  iconClass: "text-blue-300",
                  title: "SBT Reputation",
                  body: "Skill-bound tokens verify expertise.",
                },
              ].map((item, index) => {
                const IconWrap = item.iconWrap;

                return (
                  <Reveal key={item.title} delay={index * 80}>
                    <li className="flex items-start gap-3">
                      <div className={`p-2 bg-[#111827] rounded text-sm ${item.iconClass}`}>
                        <IconWrap />
                      </div>
                      <div>
                        <div style={orbitronStyle} className="text-sm font-semibold">
                          {item.title}
                        </div>
                        <div style={robotoStyle} className="text-xs text-gray-400">
                          {item.body}
                        </div>
                      </div>
                    </li>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <aside className="w-full space-y-4">
            <div className="rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-[#162036] bg-[#0f121e]/85">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={logo} alt="logo" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 style={orbitronStyle} className="text-lg font-bold">
                      AI Job Match — Frontend React
                    </h3>
                    <div className="text-xs px-2 py-1 bg-[#1f2a45] rounded">
                      Hourly
                    </div>
                  </div>

                  <p style={robotoStyle} className="text-sm text-gray-300 mt-2">
                    Build a responsive dashboard using React, TypeScript and
                    Tailwind — 20 hours estimated.
                  </p>

                  <div
                    className="ml-auto mt-4 text-lg font-extrabold"
                    style={orbitronStyle}
                  >
                    $55/hr
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-300">
                <div className="p-2 bg-[#081421] rounded">React</div>
                <div className="p-2 bg-[#081421] rounded">TypeScript</div>
                <div className="p-2 bg-[#081421] rounded">Tailwind</div>
              </div>
            </div>

            {loadingSnapshot ? (
              <SurfaceSkeleton />
            ) : (
              <MiniSurface
                title="Client workspace"
                meta="Hiring, review, and escrow activity"
                rows={clientRows}
              />
            )}
          </aside>
        </Reveal>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <Reveal>
          <div className="bg-[#0f121e] rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border border-[#162036]">
            <div>
              <h4 style={orbitronStyle} className="text-lg">
                For Clients
              </h4>
              <p style={robotoStyle} className="text-sm text-gray-300 mt-2 leading-6">
                Post transparent gigs, compare bids, lock funds in escrow, and manage contract outcomes from one control surface.
              </p>
            </div>

            <div>
              <h4 style={orbitronStyle} className="text-lg">
                For Freelancers
              </h4>
              <p style={robotoStyle} className="text-sm text-gray-300 mt-2 leading-6">
                Get matched, build reputation, verify skills through assessments, and track credential status without leaving the platform.
              </p>
            </div>

            <div>
              <h4 style={orbitronStyle} className="text-lg">
                Open Ecosystem
              </h4>
              <p style={robotoStyle} className="text-sm text-gray-300 mt-2 leading-6">
                Composable contracts, token-gated features, DAO-ready dispute handling, and modular interfaces built for expansion.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <SectionHeading
          eyebrow="Workflow"
          title="How the platform works end to end"
          description="NeuroGuild is designed around the actual lifecycle of a freelance agreement: discovery, escrow, delivery, verification, and governance-aware resolution."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflow.map((step, index) => (
            <Reveal key={step.title} delay={index * 80}>
              <WorkflowStep {...step} />
            </Reveal>
          ))}
        </div>
      </section>

     

      <section className="max-w-6xl mx-auto px-6 py-10">
        <SectionHeading
          eyebrow="Platform Metrics"
          title="What progress looks like in a healthy network"
          description="Metrics help the product communicate trust and momentum without turning the page into a marketing-heavy dashboard."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            [
              liveStats?.protectedContracts != null
                ? `${liveStats.protectedContracts}`
                : "148+",
              "Protected contracts",
              "Escrow-backed engagements already structured through the workflow.",
            ],
            [
              liveStats?.skillCredentials != null
                ? `${liveStats.skillCredentials}`
                : "26",
              "Skill credentials",
              "Quiz-cleared, council-issued badges that improve trust in hiring.",
            ],
            [
              liveStats?.submittedReviews != null
                ? `${liveStats.submittedReviews}`
                : "94%",
              "Review queue",
              "Submitted jobs currently waiting for acceptance or dispute handling.",
            ],
            [
              liveStats?.governanceResolutions != null
                ? `${liveStats.governanceResolutions}`
                : "12",
              "Governance activity",
              "Recent proposals and dispute-related protocol actions in motion.",
            ],
          ].map(([value, label, note], index) => (
            <Reveal key={label} delay={index * 70}>
              <StatCard label={label} value={value} note={note} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
          <Reveal>
            <div className="rounded-lg border border-[#162036] bg-[#0f121e]/95 p-6">
              <SectionHeading
                eyebrow="Live Pulse"
                title="What is happening inside the app right now"
                description="These panels reflect current hiring demand, review load, and governance movement so the homepage feels connected to the actual product."
              />
              <div className="grid grid-cols-1 gap-3">
                {livePulse.map((item, index) => (
                  <Reveal key={item.label} delay={index * 70}>
                    <PulseCard {...item} />
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            {loadingSnapshot ? (
              <SurfaceSkeleton />
            ) : (
              <ActivityFeed items={activityFeedItems} />
            )}
          </Reveal>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <Reveal>
            <div className="rounded-lg border border-[#162036] bg-[#0f121e]/95 p-6">
              <SectionHeading
                eyebrow="Ecosystem"
                title="Built from composable product layers"
                description="The platform blends Web3 primitives with familiar SaaS workflows so the product feels usable, not experimental."
              />
              <div className="grid grid-cols-2 gap-3">
                {ecosystems.map((item, index) => (
                  <Reveal key={item} delay={index * 60}>
                    <div className="rounded-lg border border-[#162036] bg-[#111827]/80 px-4 py-3 text-sm text-gray-300">
                      {item}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-lg border border-[#162036] bg-[#0f121e]/95 p-6">
              <SectionHeading
                eyebrow="Community"
                title="Built for teams that care about operational trust"
                description="The value proposition is strongest for founders, DAOs, and specialized freelancers who need more structure than a generic marketplace provides."
              />
              <div className="space-y-4">
                {testimonials.map((item, index) => (
                  <Reveal key={item.author} delay={index * 80}>
                    <div className="rounded-lg border border-[#162036] bg-[#111827]/80 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-[#0f1422] p-2 text-[#14a19f]">
                          <MessageSquareText size={16} />
                        </div>
                        <div>
                          <p style={robotoStyle} className="text-sm text-gray-200 leading-7">
                            “{item.quote}”
                          </p>
                          <div className="mt-4">
                            <p className="text-sm font-medium text-white">{item.author}</p>
                            <p className="text-xs text-gray-500">{item.role}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <Reveal>
          <div className="rounded-lg border border-[#162036] bg-[#0f121e]/95 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-md border border-[#162036] bg-[#111827]/70 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-gray-400">
                  <Sparkles size={12} className="text-[#14a19f]" />
                  Get Started
                </div>
                <h2
                  style={orbitronStyle}
                  className="mt-4 text-2xl md:text-3xl font-bold text-white"
                >
                  Explore the product where contracts, credentials, and governance actually connect
                </h2>
                <p style={robotoStyle} className="mt-4 text-sm md:text-base text-gray-300 leading-7">
                  Whether you are hiring, freelancing, or evaluating protocol-grade workflows, NeuroGuild is designed to make trust operational instead of aspirational.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/browse-jobs"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#14a19f] px-5 py-3 text-sm font-semibold text-[#081220] transition-colors hover:bg-[#1ecac7]"
                >
                  Browse active jobs
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/governance"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#162036] bg-[#111827]/70 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#14a19f]/40"
                >
                  View governance
                  <Blocks size={15} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between text-gray-400">
          <div style={robotoStyle} className="text-sm">
            © {new Date().getFullYear()} NeuroGuild
          </div>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
