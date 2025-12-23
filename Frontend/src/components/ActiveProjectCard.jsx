import React from "react";
import { Clock, MessageSquare, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ActiveProjectCard({ project }) {
  const navigate = useNavigate();

  const progressPercentage = project?.progress || 0;

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(project?.deadline) - new Date()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const handleMessage = () => {
    navigate("/messages", {
      state: { recipient: project.clientName || project.clientAddress },
    });
  };

  const handleViewContract = () => {
    navigate("/freelancer/contract", { state: { project } });
  };

  return (
    <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-5 hover:border-[#14a19f]/50 transition-all space-y-4">
      
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
            <span className="text-[#14a19f] font-semibold">
              ${project?.contractValue || 0}
            </span>
          </p>
        </div>

        <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-medium">
          ✓ In Progress
        </span>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#14a19f]/10 rounded p-2">
          <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <Clock size={12} />
            Days Remaining
          </p>
          <p
            className={`font-semibold ${
              daysRemaining < 3 ? "text-red-400" : "text-white"
            }`}
          >
            {daysRemaining} days
          </p>
        </div>

        <div className="bg-[#14a19f]/10 rounded p-2">
          <p className="text-gray-400 text-xs mb-1">Status</p>
          <p className="text-white font-semibold">In Progress</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 line-clamp-3 bg-[#161c32]/50 rounded p-3">
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
                    : "border-gray-500"
                }`}
              >
                {m.completed && (
                  <span className="text-green-400 text-sm">✓</span>
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
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleViewContract}
          className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-sm font-medium py-2 rounded flex items-center justify-center gap-2"
        >
          <FileText size={16} />
          Contract
        </button>

        <button
          onClick={handleMessage}
          className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 text-sm font-medium py-2 rounded flex items-center justify-center gap-2"
        >
          <MessageSquare size={16} />
          Message
        </button>
      </div>

      {/* Urgent Warning */}
      {daysRemaining < 3 && daysRemaining > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
          <span className="text-xs text-yellow-400">
            ⚠️ Deadline approaching
          </span>
        </div>
      )}
    </div>
  );
}

export default ActiveProjectCard;
