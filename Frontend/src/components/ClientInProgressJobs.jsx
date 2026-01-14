import React, { useState } from "react";

function ClientInProgressJobs({ job, setNotice, setRedNotice }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
          <div className="w-full max-w-4xl bg-[#0d1224] border border-[#14a19f]/30 rounded-2xl p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Job In Progress
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="px-3 py-1 text-sm rounded-md border border-[#14a19f]/40 text-[#14a19f] hover:bg-[#14a19f]/10"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={job.bid.freelancerPfp}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="text-white font-semibold">
                    {job.bid.freelancerName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {job.bid.freelancerAddress?.slice(0, 6)}...
                    {job.bid.freelancerAddress?.slice(-4)}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-300">
                <p className="mb-2 font-semibold text-white">Proposal</p>
                <p>{job.bid.proposal || "No proposal provided"}</p>
              </div>

              <div className="flex flex-wrap gap-3 justify-end mt-6">
                <button className="px-4 py-2 text-sm rounded-md border border-[#14a19f]/40 text-[#14a19f] hover:bg-[#14a19f]/10">
                  View Profile
                </button>

                <button className="px-4 py-2 text-sm rounded-md border border-[#14a19f]/40 text-[#14a19f] hover:bg-[#14a19f]/10">
                  Message Freelancer
                </button>

                <button className="px-4 py-2 text-sm rounded-md border border-[#14a19f]/40 text-[#14a19f] hover:bg-[#14a19f]/10">
                  View Proof
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CARD */}
      <div className="backdrop-blur-md mt-4 border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-6 hover:bg-[#0d1224]/70 transition-all">
        <h3 className="text-lg font-semibold text-white mb-3">
          {job.jobTitle}
        </h3>

        <p className="text-gray-400 text-sm mb-4">
          {job.jobDescription}
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          {job.skills?.map((skill) => (
            <span
              key={skill}
              className="bg-[#14a19f]/10 text-[#14a19f] px-3 py-1 rounded-full text-xs border border-[#14a19f]/30"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#14a19f]/10">
          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Budget</p>
              <p className="text-gray-300 font-medium">
                ${job.budget}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-xs">Deadline</p>
              <p className="text-gray-300 font-medium">
                {job.deadline
                  ? new Date(job.deadline).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-xs">Status</p>
              <p className="text-[#14a19f] font-medium">In Progress</p>
            </div>
          </div>

          <button
            onClick={() => setShowDetails(true)}
            className="px-5 py-2 text-sm rounded-md border border-[#14a19f]/40 text-[#14a19f] hover:bg-[#14a19f]/10"
          >
            View Details
          </button>
        </div>
      </div>
    </>
  );
}

export default ClientInProgressJobs;
