import React from "react";
import ProjectActionButtons from "./ProjectActionButtons";

const statusStyles = {
  Open: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
  InProgress: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
  Submitted: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
  Completed: "bg-green-500/20 text-green-300 border border-green-500/40",
  Disputed: "bg-orange-500/20 text-orange-300 border border-orange-500/40",
  Cancelled: "bg-red-500/20 text-red-300 border border-red-500/40",
  Expired: "bg-rose-500/20 text-rose-300 border border-rose-500/40",
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
  return (
    <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-5 hover:border-[#14a19f]/40 transition-all space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {project?.jobTitle || "Untitled Job"}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Job ID: {project?.jobId || "N/A"}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || statusStyles.Open}`}
        >
          {status}
        </span>
      </div>

      <p className="text-sm text-gray-300 bg-[#161c32]/50 rounded p-3">
        {project?.jobDescription || "No description provided."}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Budget</p>
          <p className="text-gray-300 font-medium">
            ${project?.budget ?? project?.contractValue ?? project?.bidAmount ?? 0}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Deadline</p>
          <p className="text-gray-300 font-medium">
            {project?.deadline ? new Date(project.deadline).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Client</p>
          <p className="text-gray-300 font-medium line-clamp-1">
            {project?.clientName || project?.clientAddress || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Freelancer</p>
          <p className="text-gray-300 font-medium line-clamp-1">
            {project?.freelancerName || project?.freelancerAddress || "N/A"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(project?.skills || []).map((skill) => (
          <span
            key={skill}
            className="bg-[#14a19f]/10 text-[#14a19f] px-3 py-1 rounded-full text-xs border border-[#14a19f]/30"
          >
            {skill}
          </span>
        ))}
      </div>

      {showActions ? (
        <ProjectActionButtons
          onShowContract={onShowContract}
          onMessage={onMessage}
          onArchive={onArchive}
          showArchive={showArchive}
          contractLabel="Show Contract"
          messageLabel="Message"
          archiveLabel="Archive"
        />
      ) : null}

      {extraActions ? <div className="pt-1">{extraActions}</div> : null}
    </div>
  );
}

export default StatusProjectCard;
