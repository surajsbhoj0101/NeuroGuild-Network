import React from "react";
import { Archive, FileText, MessageSquare } from "lucide-react";

function ProjectActionButtons({
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
      <button
        onClick={onShowContract}
        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-sm font-medium py-2 rounded flex items-center justify-center gap-2 transition-colors"
      >
        <FileText size={16} />
        {contractLabel}
      </button>

      <button
        onClick={onMessage}
        className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 text-sm font-medium py-2 rounded flex items-center justify-center gap-2 transition-colors"
      >
        <MessageSquare size={16} />
        {messageLabel}
      </button>

      {showArchive ? (
        <button
          onClick={onArchive}
          className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 border border-gray-500/30 text-sm font-medium py-2 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <Archive size={16} />
          {archiveLabel}
        </button>
      ) : null}
    </div>
  );
}

export default ProjectActionButtons;
