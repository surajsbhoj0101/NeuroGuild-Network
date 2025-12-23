import React from "react";
import { Star, FileCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

function CompletedProjectCard({ project }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate("/freelancer/project-details", {
      state: { project },
    });
  };

  const handleLeaveReview = () => {
    navigate("/freelancer/add-portfolio", {
      state: { project },
    });
  };

  return (
    <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-5 hover:border-[#14a19f]/50 transition-all space-y-4">
      
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {project?.jobTitle || "Untitled Job"}
          </h3>
          <p className="text-sm text-gray-400">
            Client:{" "}
            <span className="text-gray-300">
              {project?.clientName || "Unknown"}
            </span>
          </p>
        </div>

        <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-medium">
          ✓ Completed
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#14a19f]/10 rounded p-2">
          <p className="text-gray-400 text-xs mb-1">Amount Earned</p>
          <p className="text-[#14a19f] font-semibold">
            ${project?.amountEarned || 0}
          </p>
        </div>

        <div className="bg-[#14a19f]/10 rounded p-2">
          <p className="text-gray-400 text-xs mb-1">Completed On</p>
          <p className="text-white font-semibold">
            {project?.completedDate
              ? new Date(project.completedDate).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>

      {project?.clientRating && (
        <div className="bg-[#161c32]/50 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} className="text-yellow-400" />
            <span className="text-sm font-semibold text-white">
              {project.clientRating}/5
            </span>
          </div>
          <p className="text-sm text-gray-300">
            {project.clientComment || "No comment provided"}
          </p>
        </div>
      )}

      <div className="flex gap-4 text-xs text-gray-400">
        <span>{project?.daysWorked || 0} days</span>
        <span> {project?.deliverables || 0} deliverables</span>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleViewDetails}
          className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-sm font-medium py-2 rounded flex items-center justify-center gap-2"
        >
          <FileCheck size={16} />
          Details
        </button>

        <button
          onClick={handleLeaveReview}
          className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 text-sm font-medium py-2 rounded flex items-center justify-center gap-2"
        >
          <Star size={16} />
          Portfolio
        </button>
      </div>
    </div>
  );
}

export default CompletedProjectCard;
