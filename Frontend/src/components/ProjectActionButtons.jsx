import React from "react";
import { Archive, ChevronRight, FileText, MessageSquare } from "lucide-react";

function ProjectActionButtons({
  projectStatus,
  onShowContract,
  onMessage,
  onArchive,
  showArchive = false,
  contractLabel = "View Contract",
  messageLabel = "Message",
  archiveLabel = "Archive",
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {projectStatus !== "Open" && (
        <>
          <button
            onClick={onShowContract}
            className="group flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#14a19f]/10 hover:bg-[#14a19f]/20 border border-[#14a19f]/30 hover:border-[#14a19f]/50 text-[#7df3f0] text-sm font-semibold transition-all hover:-translate-y-0.5"
          >
            <FileText size={15} />
            {contractLabel}
            <ChevronRight size={13} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={onMessage}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-sm font-medium transition-all"
          >
            <MessageSquare size={15} />
            {messageLabel}
          </button>
        </>
      )}
      {showArchive && (
        <button
          onClick={onArchive}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/4 hover:bg-white/8 border border-white/8 text-gray-400 hover:text-gray-300 text-sm font-medium transition-all"
        >
          <Archive size={15} />
          {archiveLabel}
        </button>
      )}
    </div>
  );
}

export default ProjectActionButtons;
