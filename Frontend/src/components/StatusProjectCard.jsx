import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Calendar, ChevronDown, ChevronUp, DollarSign, User } from "lucide-react";
import ProjectActionButtons from "./ProjectActionButtons";

const statusConfig = {
  Open:       { bg: "bg-cyan-500/15",    text: "text-cyan-300",    border: "border-cyan-500/35",    bar: "bg-cyan-400/70"    },
  InProgress: { bg: "bg-blue-500/15",    text: "text-blue-300",    border: "border-blue-500/35",    bar: "bg-blue-400/70"    },
  Submitted:  { bg: "bg-amber-500/15",   text: "text-amber-300",   border: "border-amber-500/35",   bar: "bg-amber-400/70"   },
  Completed:  { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/35", bar: "bg-emerald-400/70" },
  Disputed:   { bg: "bg-orange-500/15",  text: "text-orange-300",  border: "border-orange-500/35",  bar: "bg-orange-400/70"  },
  Cancelled:  { bg: "bg-red-500/15",     text: "text-red-300",     border: "border-red-500/35",     bar: "bg-red-400/70"     },
  Expired:    { bg: "bg-rose-500/15",    text: "text-rose-300",    border: "border-rose-500/35",    bar: "bg-rose-400/70"    },
};

function StatusProjectCard({
  project,
  status,
  showActions = false,
  showArchive = false,
  extraActions = null,
  onShowContract,
  onMessage,
  onArchive,
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[status] || statusConfig.Open;
  const clientLabel = project?.clientName || project?.clientAddress || "N/A";
  const freelancerLabel = project?.freelancerName || project?.freelancerAddress || "N/A";
  const desc = project?.jobDescription || "";
  const isLong = desc.length > 130;

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#14a19f]/18 bg-[#0b1022]/75 hover:border-[#14a19f]/35 hover:bg-[#0d1224]/80 transition-all duration-200">
      <div className={`absolute left-0 top-0 h-full w-[3px] ${cfg.bar}`} />

      <div className="pl-4 pr-4 pt-4 pb-3 md:pl-5 md:pr-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base md:text-lg font-semibold text-white leading-snug">
              {project?.jobTitle || "Untitled Job"}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-mono tracking-wide">
              #{project?.jobId || "N/A"}
            </p>
          </div>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {status}
          </span>
        </div>

        {/* Description */}
        {desc && (
          <div>
            <p className={`text-sm text-gray-400 leading-relaxed ${!expanded && isLong ? "line-clamp-2" : ""}`}>
              {desc}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded(prev => !prev)}
                className={`mt-1 inline-flex items-center gap-1 text-xs ${cfg.text} hover:opacity-80 transition-opacity`}
              >
                {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
              </button>
            )}
          </div>
        )}

        {/* Meta tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg bg-white/[0.03] border border-white/6 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-500 flex items-center gap-1 mb-1">
              <DollarSign size={9} />
              {project?.amountEarned != null ? "Earned" : "Budget"}
            </p>
            <p className="text-sm font-semibold text-white">
              ${project?.amountEarned ?? project?.budget ?? project?.contractValue ?? project?.bidAmount ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/6 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-500 flex items-center gap-1 mb-1">
              <Calendar size={9} />
              Deadline
            </p>
            <p className="text-sm font-semibold text-white">
              {project?.deadline ? new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "N/A"}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/6 px-3 py-2 min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-500 flex items-center gap-1 mb-1">
              <Briefcase size={9} />
              Client
            </p>
            {project?.clientId ? (
              <Link to={`/profile/${project.clientId}`} className={`text-sm font-semibold underline underline-offset-2 truncate block ${cfg.text} hover:opacity-80`}>
                {clientLabel}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-white truncate">{clientLabel}</p>
            )}
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/6 px-3 py-2 min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-500 flex items-center gap-1 mb-1">
              <User size={9} />
              Freelancer
            </p>
            {project?.freelancerId ? (
              <Link to={`/profile/${project.freelancerId}`} className={`text-sm font-semibold underline underline-offset-2 truncate block ${cfg.text} hover:opacity-80`}>
                {freelancerLabel}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-white truncate">{freelancerLabel}</p>
            )}
          </div>
        </div>

        {/* Skills */}
        {(project?.skills || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(project.skills || []).map((skill) => (
              <span key={skill} className="bg-[#14a19f]/8 text-[#8ff6f3] px-2.5 py-0.5 rounded-full text-[11px] border border-[#14a19f]/20">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {(showActions || extraActions) && (
          <div className="pt-2 border-t border-white/6 space-y-2">
            {showActions && (
              <ProjectActionButtons
                projectStatus={status}
                onShowContract={onShowContract}
                onMessage={onMessage}
                onArchive={onArchive}
                showArchive={showArchive}
                contractLabel="View Contract"
                messageLabel="Message"
                archiveLabel="Archive"
              />
            )}
            {extraActions && <div>{extraActions}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatusProjectCard;
