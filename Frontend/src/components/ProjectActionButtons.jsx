import React from "react";
import { Archive, ChevronRight, FileText, MessageSquare } from "lucide-react";

function ProjectActionButtons({
  projectStatus,
  onShowContract,
  onMessage,
  onArchive,
  showArchive = false,
  contractLabel = "Show Contract",
  messageLabel = "Message",
  archiveLabel = "Archive",
}) {
  return (
    <div className="flex gap-2 pt-2">
      {projectStatus === 'Open' ? ("") : (
        <div className="flex gap-2 pt-2">
          <button
            onClick={onShowContract}
            className="group flex-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-400/40 text-sm font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          >
            <FileText size={16} />
            {contractLabel}
            <ChevronRight size={14} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={onMessage}
            className="flex-1 bg-slate-500/15 hover:bg-slate-500/25 text-slate-200 border border-slate-400/30 text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <MessageSquare size={16} />
            {messageLabel}
          </button>
        </div>
      )}


      {showArchive ? (
        <button
          onClick={onArchive}
          className="flex-1 bg-gray-500/15 hover:bg-gray-500/25 text-gray-300 border border-gray-500/30 text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Archive size={16} />
          {archiveLabel}
        </button>
      ) : null}
    </div>
  );
}

export default ProjectActionButtons;
