import React, { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContractDetailsModal from "../../ContractDetailsModal";
import ProjectActionButtons from "../../ProjectActionButtons";

function ExpiredProjectCard({ project }) {
  const navigate = useNavigate();
  const [showContractModal, setShowContractModal] = useState(false);

  const daysExpired = Math.max(
    0,
    Math.ceil(
      (new Date() - new Date(project?.deadline)) /
        (1000 * 60 * 60 * 24)
    )
  );

  const handleMessage = () => {
    navigate("/messages", {
      state: { recipient: project.clientName || project.clientAddress },
    });
  };

      const handleViewContract = () => {
    setShowContractModal(true);
  };

  const handleArchive = () => {};

  const contractDetails = useMemo(
    () => ({
      jobId: project?.jobId,
      jobTitle: project?.jobTitle,
      jobDescription: project?.jobDescription,
      clientName: project?.clientName || "Unknown Client",
      clientAddress: project?.clientAddress,
      freelancerName: project?.freelancerName || "You",
      freelancerAddress: project?.freelancerAddress,
      contractValue: project?.contractValue,
      deadline: project?.deadline,
      status: project?.status || "Expired",
      skills: project?.skills || [],
      milestones: project?.milestones || [],
    }),
    [project]
  );

  return (
    <>
      <ContractDetailsModal
        open={showContractModal}
        onClose={() => setShowContractModal(false)}
        contract={contractDetails}
      />

      <div className="backdrop-blur-md border border-red-500/20 bg-red-950/10 rounded-xl p-5 hover:border-red-500/40 transition-all space-y-4 opacity-80">
      
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white line-clamp-2 mb-2">
            {project?.jobTitle || "Untitled Job"}
          </h3>

          <p className="text-sm text-gray-300 mb-1">
            Client:{" "}
            <span className="font-medium">
              {project?.clientName || "Unknown"}
            </span>
          </p>

          <p className="text-xs text-gray-400">
            Contract Value:{" "}
            <span className="text-red-400 font-semibold">
              ${project?.contractValue || 0}
            </span>
          </p>
        </div>

        <span className="bg-red-500/20 text-red-300 border border-red-500/50 px-3 py-1 rounded-full text-xs font-medium">
          ✗ Expired
        </span>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-red-500/10 rounded p-2 border border-red-500/20">
          <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <Clock size={12} />
            Expired
          </p>
          <p className="font-semibold text-red-400">
            {daysExpired} day{daysExpired !== 1 ? "s" : ""} ago
          </p>
        </div>

        <div className="bg-red-500/10 rounded p-2 border border-red-500/20">
          <p className="text-gray-400 text-xs mb-1">Status</p>
          <p className="text-red-300 font-semibold">Past Deadline</p>
        </div>
      </div>

      {/* Deadline Info */}
      <div className="bg-red-500/5 border border-red-500/30 rounded p-3">
        <p className="text-xs text-red-300">
          Deadline was on: <span className="font-semibold">{new Date(project?.deadline).toLocaleDateString()}</span>
        </p>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 bg-[#161c32]/30 rounded p-3 italic">
        {project?.jobDescription || "No description"}
      </p>

      {/* Milestones */}
      {project?.milestones?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400">Milestones</p>

          {project.milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  m.completed
                    ? "bg-green-500/20 border-green-500"
                    : "bg-red-500/20 border-red-500"
                }`}
              >
                {m.completed ? (
                  <span className="text-green-400 text-sm">✓</span>
                ) : (
                  <span className="text-red-400 text-sm">✗</span>
                )}
              </div>

              <span
                className={
                  m.completed
                    ? "text-gray-500 line-through"
                    : "text-gray-300"
                }
              >
                {m.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <ProjectActionButtons
        onShowContract={handleViewContract}
        onMessage={handleMessage}
        onArchive={handleArchive}
        showArchive={true}
        contractLabel="Contract"
        messageLabel="Message"
        archiveLabel="Archive"
      />

        {/* Expired Notice */}
        <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
          <span className="text-xs text-red-300">
            🔴 This project deadline has expired. Please review and take necessary actions.
          </span>
        </div>
      </div>
    </>
  );
}

export default ExpiredProjectCard;
