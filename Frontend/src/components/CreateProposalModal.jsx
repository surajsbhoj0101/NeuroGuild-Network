import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

const robotoStyle = { fontFamily: "Roboto, sans-serif" };

function CreateProposalModal({
  isOpen,
  onClose,
  submitProposal,
  isSubmitting = false,
  proposalForm,
  onChange,
  onActionChange,
  onAddAction,
  onRemoveAction,
}) {
  if (!isOpen) {
    return null;
  }

  const descriptionLength = proposalForm.description?.length;
  const rationaleLength = proposalForm.rationale?.length;
  const readyActions = proposalForm.actions.filter(
    (action) => action.target.trim() && action.functionSignature.trim()
  )?.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm p-0 md:p-6">
      <div className="h-full w-full flex items-end md:items-center justify-center">
        <div className="w-full md:max-w-6xl h-[100dvh] md:h-auto md:max-h-[92vh] overflow-y-auto rounded-none md:rounded-3xl border border-[#14a19f]/25 bg-[#0b1326]/95 shadow-2xl">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-5 md:p-6 border-b border-[#14a19f]/20 bg-[#0b1326]/95">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#14a19f]/35 bg-[#14a19f]/10 text-[#8ff6f3] text-xs tracking-wide uppercase mb-3">
                <Sparkles size={14} />
                Proposal Composer
              </div>
              <h2 className="text-white text-2xl font-bold">Create Proposal</h2>
              <p className="text-sm text-gray-400 mt-2 max-w-2xl" style={robotoStyle}>
                Build the proposal payload for `Governor.propose(targets, values, calldatas, description)`.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              aria-label="Close create proposal modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.8fr]">
            <div className="p-5 md:p-6 space-y-5 xl:border-r border-[#14a19f]/15">
              <div className="grid grid-cols-1 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-200 mb-2 inline-flex items-center gap-2">
                    <FileText size={14} className="text-[#8ff6f3]" />
                    Proposal Title
                  </span>
                  <input
                    type="text"
                    value={proposalForm.title}
                    onChange={(event) => onChange("title", event.target.value)}
                    placeholder="Example: Allocate treasury budget for mentor grants"
                    className="w-full bg-[#111a33] text-white px-4 py-3 rounded-xl border border-white/10 hover:border-[#14a19f]/30 focus:border-[#14a19f] focus:ring-2 focus:ring-[#14a19f]/20 outline-none transition-all placeholder:text-gray-500"
                    style={robotoStyle}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-gray-200 mb-2 inline-flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#8ff6f3]" />
                    Description
                  </span>
                  <textarea
                    rows={5}
                    maxLength={400}
                    value={proposalForm.description}
                    onChange={(event) => onChange("description", event.target.value)}
                    placeholder="This becomes the Governor description string and should summarize the proposal clearly."
                    className="w-full bg-[#111a33] text-white px-4 py-3 rounded-xl border border-white/10 hover:border-[#14a19f]/30 focus:border-[#14a19f] focus:ring-2 focus:ring-[#14a19f]/20 outline-none transition-all placeholder:text-gray-500 resize-none"
                    style={robotoStyle}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Used as the on-chain proposal description.</span>
                    <span>{descriptionLength}/400</span>
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-gray-200 mb-2 inline-flex items-center gap-2">
                    <AlertCircle size={14} className="text-[#8ff6f3]" />
                    Rationale
                  </span>
                  <textarea
                    rows={5}
                    maxLength={500}
                    value={proposalForm.rationale}
                    onChange={(event) => onChange("rationale", event.target.value)}
                    placeholder="Explain the impact, tradeoffs, and why token holders should support it."
                    className="w-full bg-[#111a33] text-white px-4 py-3 rounded-xl border border-white/10 hover:border-[#14a19f]/30 focus:border-[#14a19f] focus:ring-2 focus:ring-[#14a19f]/20 outline-none transition-all placeholder:text-gray-500 resize-none"
                    style={robotoStyle}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Companion context for the community UI.</span>
                    <span>{rationaleLength}/500</span>
                  </div>
                </label>
              </div>

              <div className="rounded-2xl border border-[#14a19f]/20 bg-[#101b35] p-4 md:p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-white text-lg font-semibold">On-chain Actions</h3>
                    <p className="text-xs text-gray-400 mt-1" style={robotoStyle}>
                      Each row maps to one index in `targets`, `values`, and encoded `calldatas`.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onAddAction}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#14a19f]/35 bg-[#14a19f]/10 text-[#8ff6f3] text-sm font-semibold hover:bg-[#14a19f]/20 transition-colors"
                  >
                    <Plus size={16} />
                    Add Action
                  </button>
                </div>

                <div className="space-y-4">
                  {proposalForm.actions.map((action, index) => (
                    <div
                      key={action.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-sm font-semibold text-white">Action {index + 1}</p>
                        {proposalForm.actions?.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => onRemoveAction(action.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.6fr] gap-3">
                        <label className="block">
                          <span className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">
                            Target Address
                          </span>
                          <input
                            type="text"
                            value={action.target}
                            onChange={(event) =>
                              onActionChange(action.id, "target", event.target.value)
                            }
                            placeholder="0x..."
                            className="w-full bg-[#111a33] text-white px-4 py-3 rounded-xl border border-white/10 hover:border-[#14a19f]/30 focus:border-[#14a19f] focus:ring-2 focus:ring-[#14a19f]/20 outline-none transition-all placeholder:text-gray-500"
                            style={robotoStyle}
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">
                            Value (wei)
                          </span>
                          <input
                            type="text"
                            value={action.value}
                            onChange={(event) =>
                              onActionChange(action.id, "value", event.target.value)
                            }
                            placeholder="0"
                            className="w-full bg-[#111a33] text-white px-4 py-3 rounded-xl border border-white/10 hover:border-[#14a19f]/30 focus:border-[#14a19f] focus:ring-2 focus:ring-[#14a19f]/20 outline-none transition-all placeholder:text-gray-500"
                            style={robotoStyle}
                          />
                        </label>
                      </div>

                      <label className="block mt-3">
                        <span className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">
                          Function Signature
                        </span>
                        <input
                          type="text"
                          value={action.functionSignature}
                          onChange={(event) =>
                            onActionChange(action.id, "functionSignature", event.target.value)
                          }
                          placeholder='changeValue(string)'
                          className="w-full bg-[#111a33] text-white px-4 py-3 rounded-xl border border-white/10 hover:border-[#14a19f]/30 focus:border-[#14a19f] focus:ring-2 focus:ring-[#14a19f]/20 outline-none transition-all placeholder:text-gray-500"
                          style={robotoStyle}
                        />
                      </label>
                      <label className="block mt-3">
                        <span className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">
                          Arguments (JSON)
                        </span>
                        <textarea
                          rows={3}
                          value={action.args}
                          onChange={(event) =>
                            onActionChange(action.id, "args", event.target.value)
                          }
                          placeholder={'["Hello DAO"]'}
                          className="w-full bg-[#111a33] text-white px-4 py-3 rounded-xl border border-white/10 hover:border-[#14a19f]/30 focus:border-[#14a19f] focus:ring-2 focus:ring-[#14a19f]/20 outline-none transition-all placeholder:text-gray-500 resize-none"
                          style={robotoStyle}
                        />
                        <p className="mt-2 text-xs text-gray-500" style={robotoStyle}>
                          Example: `changeValue(string)` with `["Hello DAO"]`
                        </p>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 bg-[#0e1730]/80 border-t xl:border-t-0 border-[#14a19f]/15">
              <div className="rounded-2xl border border-[#14a19f]/20 bg-[#101b35] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8ff6f3] mb-3">
                  Contract Rules
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-gray-300">Voting delay</span>
                    <span className="text-white">7200 blocks</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-gray-300">Voting period</span>
                    <span className="text-white">50400 blocks</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-gray-300">Proposal threshold</span>
                    <span className="text-white">1 GOV</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-gray-300">Quorum fraction</span>
                    <span className="text-white">4%</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-400 leading-relaxed" style={robotoStyle}>
                  These values come from `GovernerContract.sol` and are displayed here as fixed governance parameters.
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-[#14a19f]/20 bg-[#101b35] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8ff6f3] mb-3">
                  Submission Preview
                </p>
                <h3 className="text-white text-xl font-semibold" style={robotoStyle}>
                  {proposalForm.title || "Untitled Proposal"}
                </h3>
                <p className="mt-3 text-sm text-gray-300 leading-relaxed" style={robotoStyle}>
                  {proposalForm.description || "The proposal description will appear here."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-gray-400 text-xs">Actions</p>
                    <p className="text-white font-semibold">{proposalForm.actions?.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-gray-400 text-xs">Ready Actions</p>
                    <p className="text-white font-semibold">{readyActions}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#14a19f]/20 bg-[#101b35] p-5 space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-gray-300">Title provided</span>
                  <span className={proposalForm.title ? "text-emerald-300" : "text-amber-300"}>
                    {proposalForm.title ? "Ready" : "Missing"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-gray-300">Description provided</span>
                  <span className={proposalForm.description ? "text-emerald-300" : "text-amber-300"}>
                    {proposalForm.description ? "Ready" : "Missing"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-gray-300">At least one complete action</span>
                  <span className={readyActions > 0 ? "text-emerald-300" : "text-amber-300"}>
                    {readyActions > 0 ? "Ready" : "Missing"}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={submitProposal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#14a19f] hover:bg-[#1ecac7] text-white text-sm font-semibold transition-colors"
                >
                  {isSubmitting ? "Submitting..." : "Submit Proposal"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateProposalModal;
