import React from "react";
import { X } from "lucide-react";

function formatDate(dateValue) {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
}

function formatCurrency(value) {
  if (value === undefined || value === null || value === "") return "N/A";
  const amount = Number(value);
  if (Number.isNaN(amount)) return `${value}`;
  return `$${amount}`;
}

function ContractDetailsModal({ open, onClose, contract }) {
  if (!open || !contract) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-[#0d1224] border border-[#14a19f]/30 rounded-2xl shadow-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-[#0d1224] border-b border-[#14a19f]/20 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-wide uppercase text-[#14a19f]">
              Contract Details
            </p>
            <h2 className="text-xl font-semibold text-white">
              {contract.jobTitle || "Untitled Job"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md border border-[#14a19f]/40 text-[#14a19f] hover:bg-[#14a19f]/10"
            aria-label="Close contract details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Client
              </p>
              <p className="text-white font-medium">{contract.clientName}</p>
              <p className="text-xs text-gray-400 break-all">
                {contract.clientAddress || "N/A"}
              </p>
            </div>

            <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Freelancer
              </p>
              <p className="text-white font-medium">
                {contract.freelancerName || "You"}
              </p>
              <p className="text-xs text-gray-400 break-all">
                {contract.freelancerAddress || "N/A"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
              <p className="text-xs text-gray-400 mb-1">Contract Value</p>
              <p className="text-[#14a19f] text-lg font-semibold">
                {formatCurrency(contract.contractValue)}
              </p>
            </div>
            <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
              <p className="text-xs text-gray-400 mb-1">Deadline</p>
              <p className="text-white font-medium">
                {formatDate(contract.deadline)}
              </p>
            </div>
            <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className="text-white font-medium">{contract.status || "N/A"}</p>
            </div>
            <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
              <p className="text-xs text-gray-400 mb-1">Job ID</p>
              <p className="text-white text-xs font-medium">{contract.jobId ? contract.jobId.slice(0,6) + "..." + contract.jobId.slice(-6) : "N/A"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              Scope
            </p>
            <p className="text-gray-200 text-sm whitespace-pre-wrap">
              {contract.jobDescription || "No project scope provided."}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {(contract.skills || []).length > 0 ? (
                contract.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-[#14a19f]/10 text-[#14a19f] px-3 py-1 rounded-full text-xs border border-[#14a19f]/30"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-400">No skills listed.</p>
              )}
            </div>
          </div>

          {contract.milestones?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Milestones
              </p>
              <div className="space-y-2">
                {contract.milestones.map((milestone, index) => (
                  <div
                    key={`${milestone.name || "milestone"}-${index}`}
                    className="rounded-lg border border-[#14a19f]/20 bg-[#161c32]/40 px-3 py-2 flex items-center justify-between"
                  >
                    <p className="text-sm text-gray-200">
                      {milestone.name || `Milestone ${index + 1}`}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        milestone.completed ? "text-green-400" : "text-yellow-400"
                      }`}
                    >
                      {milestone.completed ? "Completed" : "Pending"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContractDetailsModal;
