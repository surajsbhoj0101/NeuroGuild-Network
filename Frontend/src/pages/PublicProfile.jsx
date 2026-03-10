import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  ExternalLink,
  Globe,
  Github,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Twitter,
  UserRound,
  Wallet,
} from "lucide-react";
import api from "../utils/api.js";
import ReputationSbtCard from "../components/ReputationSbtCard.jsx";
import { emptyReputationProfile, fetchReputationProfile } from "../utils/fetch_reputation_profile.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
const robotoStyle = { fontFamily: "Roboto, sans-serif" };

const emptyProfileState = {
  role: "",
  walletAddress: "",
  profile: null,
};

const shortenAddress = (value) => {
  if (!value) return "Unavailable";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const toLabel = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unknown";

const normalizeFreelancerProfile = (profile, walletAddress) => ({
  name: profile?.BasicInformation?.name || "Unnamed Freelancer",
  title: profile?.BasicInformation?.title || "Freelancer",
  bio: profile?.BasicInformation?.bio || "No bio added yet.",
  location: profile?.BasicInformation?.location || "Location not provided",
  email: profile?.BasicInformation?.email || "",
  avatarUrl: profile?.BasicInformation?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${walletAddress || profile?.user || "freelancer"}`,
  walletAddress,
  availability: profile?.ProfessionalDetails?.availability || "available",
  hourlyRate: profile?.ProfessionalDetails?.hourlyRate || "",
  experience: profile?.ProfessionalDetails?.experience || "",
  github: profile?.SocialLinks?.github || "",
  linkedin: profile?.SocialLinks?.linkedIn || "",
  twitter: profile?.SocialLinks?.twitter || "",
  website: profile?.SocialLinks?.website || "",
  skills: Array.isArray(profile?.skills) ? profile.skills.filter((skill) => skill?.active !== false) : [],
});

const normalizeClientProfile = (profile, walletAddress) => ({
  name: profile?.companyDetails?.companyName || "Unnamed Client",
  title: profile?.companyDetails?.tagline || "Client",
  bio: profile?.companyDetails?.bio || "No company description added yet.",
  location: profile?.companyDetails?.location || "Location not provided",
  email: profile?.companyDetails?.publicEmail || "",
  avatarUrl: profile?.companyDetails?.logoUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${walletAddress || profile?.user || "client"}`,
  walletAddress,
  website: profile?.companyDetails?.website || "",
  stats: profile?.stats || {},
});

function InfoPill({ icon: Icon, label, value }) {
  const displayValue =
    value === 0 || value === "0" ? value : value || "Not provided";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-gray-400">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-white break-words" style={robotoStyle}>
        {displayValue}
      </p>
    </div>
  );
}

function SocialLink({ href, icon: Icon, label, type = "website" }) {
  if (!href) return null;

  const normalizedHref =
    href.startsWith("http://") || href.startsWith("https://")
      ? href
      : type === "github"
        ? `https://github.com/${href.replace(/^@/, "")}`
        : type === "linkedin"
          ? href.includes("linkedin.com")
            ? `https://${href.replace(/^https?:\/\//, "")}`
            : `https://www.linkedin.com/in/${href.replace(/^@/, "")}`
          : type === "twitter"
            ? `https://x.com/${href.replace(/^@/, "")}`
            : `https://${href}`;

  return (
    <a
      href={normalizedHref}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-[#14a19f]/20 bg-[#14a19f]/10 px-3 py-1.5 text-sm text-[#8ff6f3] transition-colors hover:bg-[#14a19f]/18"
      style={robotoStyle}
    >
      <Icon size={14} />
      <span>{label}</span>
      <ExternalLink size={13} />
    </a>
  );
}

export default function PublicProfile() {
  const { userId } = useParams();
  const { isAuthentication, userId: currentUserId } = useAuth();
  const [profileState, setProfileState] = useState(emptyProfileState);
  const [reputationProfile, setReputationProfile] = useState(emptyReputationProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/api/auth/public-profile/${userId}`);
        const nextState = {
          role: response?.data?.role || "",
          walletAddress: response?.data?.walletAddress || "",
          profile: response?.data?.profile || null,
        };

        if (cancelled) return;

        setProfileState(nextState);

        if (nextState.walletAddress) {
          const nextReputation = await fetchReputationProfile(nextState.walletAddress);
          if (!cancelled) {
            setReputationProfile(nextReputation);
          }
        } else if (!cancelled) {
          setReputationProfile(emptyReputationProfile);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError?.response?.data?.message ||
              loadError?.message ||
              "Failed to load this profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const normalized = useMemo(() => {
    if (profileState.role === "freelancer") {
      return normalizeFreelancerProfile(profileState.profile, profileState.walletAddress);
    }

    if (profileState.role === "client") {
      return normalizeClientProfile(profileState.profile, profileState.walletAddress);
    }

    return null;
  }, [profileState]);

  const isOwnProfile = Boolean(currentUserId && userId && currentUserId === userId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f111d] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-52 animate-pulse rounded-[30px] border border-[#14a19f]/12 bg-[#0d1224]/60" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-4">
              <div className="h-72 animate-pulse rounded-[26px] border border-[#14a19f]/12 bg-[#0d1224]/60" />
              <div className="h-56 animate-pulse rounded-[26px] border border-[#14a19f]/12 bg-[#0d1224]/60" />
            </div>
            <div className="h-96 animate-pulse rounded-[26px] border border-[#14a19f]/12 bg-[#0d1224]/60" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !normalized) {
    return (
      <div className="min-h-screen bg-[#0f111d] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-red-400/20 bg-[#0d1224]/75 p-8 text-center">
          <h1 className="text-2xl font-bold text-white" style={orbitronStyle}>
            Profile Unavailable
          </h1>
          <p className="mt-3 text-sm text-gray-400" style={robotoStyle}>
            {error || "This profile could not be found."}
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300"
          >
            Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#0f111d] px-4 py-6 md:px-8 md:py-8">
      <div className="pointer-events-none fixed right-[6%] top-[8%] h-[260px] w-[260px] rounded-full bg-linear-to-br from-[#17323b] via-[#10253a] to-[#0b1320] opacity-25 blur-3xl mix-blend-screen" />
      <div className="pointer-events-none fixed left-[4%] bottom-[6%] h-[300px] w-[300px] rounded-full bg-linear-to-br from-[#123637] via-[#101d34] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

      <main className="relative z-10 mx-auto max-w-6xl">
        <section className="rounded-[30px] border border-[#14a19f]/16 bg-[#0d1224]/64 p-5 backdrop-blur-md md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"
            >
              <ArrowLeft size={14} />
              Back
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#14a19f]/20 bg-[#14a19f]/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8ff6f3]">
                <ShieldCheck size={12} />
                {toLabel(profileState.role)} Profile
              </span>

              {isAuthentication && !isOwnProfile ? (
                <Link
                  to={`/messages/${userId}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/10"
                  style={robotoStyle}
                >
                  <MessageSquare size={14} />
                  Message
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <img
                src={normalized.avatarUrl}
                alt={normalized.name}
                className="h-28 w-28 rounded-[28px] border border-[#14a19f]/25 object-cover shadow-[0_18px_40px_rgba(3,8,20,0.28)]"
              />

              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.22em] text-[#14a19f]">
                  Public Profile
                </p>
                <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl" style={orbitronStyle}>
                  {normalized.name}
                </h1>
                <p className="mt-2 text-base text-gray-300" style={robotoStyle}>
                  {normalized.title}
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-400" style={robotoStyle}>
                  {normalized.bio}
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {profileState.role === "freelancer"
                      ? `${toLabel(normalized.availability)}`
                      : "Job Poster"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {shortenAddress(normalized.walletAddress)}
                  </span>
                  {profileState.role === "freelancer" && normalized.hourlyRate ? (
                    <span className="rounded-full border border-[#14a19f]/20 bg-[#14a19f]/10 px-3 py-1 text-xs text-[#8ff6f3]">
                      ${normalized.hourlyRate}/hr
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoPill icon={MapPin} label="Location" value={normalized.location} />
              <InfoPill icon={Wallet} label="Wallet" value={shortenAddress(normalized.walletAddress)} />
              <InfoPill
                icon={profileState.role === "freelancer" ? Briefcase : Building2}
                label={profileState.role === "freelancer" ? "Experience" : "Type"}
                value={
                  profileState.role === "freelancer"
                    ? normalized.experience || "Experience not added"
                    : "Client / Organization"
                }
              />
              <InfoPill icon={Mail} label="Contact" value={normalized.email || "Private"} />
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-[26px] border border-[#14a19f]/14 bg-[#0b1322]/78 p-5 backdrop-blur-sm shadow-[0_12px_40px_rgba(3,8,20,0.14)]">
              <div className="flex items-center gap-2.5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#14a19f]/18 bg-[#14a19f]/10 text-[#8ff6f3]">
                  <UserRound size={16} />
                </div>
                <h2 className="text-base font-semibold text-white">Profile Details</h2>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {profileState.role === "freelancer" ? (
                  <>
                    <InfoPill icon={Briefcase} label="Availability" value={toLabel(normalized.availability)} />
                    <InfoPill icon={Sparkles} label="Hourly Rate" value={normalized.hourlyRate ? `$${normalized.hourlyRate}/hr` : "Not provided"} />
                  </>
                ) : (
                  <>
                    <InfoPill icon={Building2} label="Company" value={normalized.name} />
                    <InfoPill icon={Globe} label="Website" value={normalized.website || "Not provided"} />
                  </>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <SocialLink href={normalized.github} icon={Github} label="GitHub" type="github" />
                <SocialLink href={normalized.linkedin} icon={Linkedin} label="LinkedIn" type="linkedin" />
                <SocialLink href={normalized.twitter} icon={Twitter} label="Twitter" type="twitter" />
                <SocialLink href={normalized.website} icon={Globe} label="Website" type="website" />
              </div>
            </div>

            {profileState.role === "freelancer" ? (
              <div className="rounded-[26px] border border-[#14a19f]/14 bg-[#0b1322]/78 p-5 backdrop-blur-sm shadow-[0_12px_40px_rgba(3,8,20,0.14)]">
                <div className="flex items-center gap-2.5">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#14a19f]/18 bg-[#14a19f]/10 text-[#8ff6f3]">
                    <Sparkles size={16} />
                  </div>
                  <h2 className="text-base font-semibold text-white">Skills</h2>
                </div>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  {normalized.skills?.length ? (
                    normalized.skills.map((skill) => (
                      <div
                        key={`${skill?.name}-${skill?.level ?? 0}`}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2"
                      >
                        <p className="text-sm font-medium text-white" style={robotoStyle}>
                          {skill?.name || "Unnamed skill"}
                        </p>
                        <p className="mt-1 text-xs text-gray-400" style={robotoStyle}>
                          Level {skill?.level ?? 0}
                          {skill?.sbt?.minted ? " • SBT minted" : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400" style={robotoStyle}>
                      No public skills listed yet.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[26px] border border-[#14a19f]/14 bg-[#0b1322]/78 p-5 backdrop-blur-sm shadow-[0_12px_40px_rgba(3,8,20,0.14)]">
                <div className="flex items-center gap-2.5">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#14a19f]/18 bg-[#14a19f]/10 text-[#8ff6f3]">
                    <Building2 size={16} />
                  </div>
                  <h2 className="text-base font-semibold text-white">Client Snapshot</h2>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <InfoPill icon={Briefcase} label="Jobs Posted" value={normalized.stats?.jobsPosted ?? 0} />
                  <InfoPill icon={Sparkles} label="Avg Rating" value={normalized.stats?.averageRating ? `${normalized.stats.averageRating}/5` : "No ratings"} />
                  <InfoPill icon={ShieldCheck} label="Payment Verified" value={normalized.stats?.paymentVerified ? "Verified" : "Not verified"} />
                  <InfoPill icon={Wallet} label="Total Spent" value={normalized.stats?.totalSpent ? `$${normalized.stats.totalSpent}` : "0"} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <ReputationSbtCard
              reputationProfile={reputationProfile}
              orbitronStyle={orbitronStyle}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
