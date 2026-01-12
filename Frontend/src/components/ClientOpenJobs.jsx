import React, { useState } from "react";
import { useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { acceptBid } from "../utils/accept_bid.js";
import { BrowserProvider } from "ethers";


function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function ClientOpenJobs({ job, setNotice, setRedNotice }) {
  const [showBids, setShowBids] = useState(false);
  const [acceptingBid, setAcceptingBid] = useState(null);

  const { data: walletClient } = useWalletClient();

  async function getSigner() {
    let signer;
    if (walletClient) {
      const provider = new BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
    }
    return signer;
  }

  async function acceptBidHandler(bidIndex, bidAmount) {
    try {
      setAcceptingBid(true);

      const signer = await getSigner();
      console.log(bidAmount)
      const res = await acceptBid(job.jobId, bidIndex, signer, bidAmount);
      if (res) {
        setRedNotice(false);
        setNotice("Bid accepted successfully");
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setRedNotice(true);
        setNotice("Bid accept failed!");
      }
    } catch (error) {
      console.error(error);
      setRedNotice(true);
      setNotice("Bid accept failed!");
    } finally {
      setAcceptingBid(false);
    }
  }

  function cancelAccept() {
    setAcceptingBid(null);
  }

  return (
    <>
      {showBids && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
          <div className="w-full max-w-4xl bg-[#0d1224] border border-[#14a19f]/30 rounded-2xl p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Bids for {job.jobTitle}
              </h2>
              <button
                onClick={() => setShowBids(false)}
                className="px-3 py-1 text-sm rounded-md border border-[#14a19f]/40 text-[#14a19f] hover:bg-[#14a19f]/10"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
              {job.bids?.map((bid, index) => (
                <div
                  key={bid.bidId}
                  className="border border-[#14a19f]/20 bg-[#0b1020]/60 rounded-xl p-5 flex flex-col gap-4 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={bid.freelancerPfp}
                        className="w-14 h-14 rounded-full"
                      />
                      <div>
                        <p className="text-white font-semibold">
                          {bid.freelancerName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {bid.freelancerAddress.slice(0, 6)}...
                          {bid.freelancerAddress.slice(-4)}
                        </p>
                      </div>
                    </div>

                    <div className="text-[#14a19f] font-semibold text-lg">
                      ${bid.bidAmount}
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm">
                    {bid.proposal || "No proposal provided"}
                  </p>

                  <div className="flex flex-wrap gap-3 justify-end">
                    <button className="px-4 py-2 text-sm rounded-md border border-[#14a19f]/40 text-[#14a19f] hover:bg-[#14a19f]/10">
                      View Profile
                    </button>

                    <button className="px-4 py-2 text-sm rounded-md border border-[#14a19f]/40 text-[#14a19f] hover:bg-[#14a19f]/10">
                      Message Freelancer
                    </button>

                    {acceptingBid === index ? (
                      <>
                        <button
                          disabled
                          className="px-5 py-2 text-sm rounded-md bg-[#14a19f] text-black flex items-center gap-2"
                        >
                          <Spinner />
                          Accepting…
                        </button>
                        <button
                          onClick={cancelAccept}
                          className="px-4 py-2 text-sm rounded-md border border-red-500/40 text-red-400 hover:bg-red-500/10"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => acceptBidHandler(bid.bidId, bid.bidAmount)}
                        className="px-5 py-2 text-sm rounded-md bg-[#14a19f] text-black hover:bg-[#1ecac7]"
                      >
                        Accept Bid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="backdrop-blur-md mt-4 border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-6 hover:bg-[#0d1224]/70 transition-all">
        <h3 className="text-lg font-semibold text-white mb-3">
          {job.jobTitle}
        </h3>

        <p className="text-gray-400 text-sm mb-4">{job.jobDescription}</p>

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
              <p className="text-gray-300 font-medium">${job.budget}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Deadline</p>
              <p className="text-gray-300 font-medium">
                {job.deadline
                  ? new Date(job.deadline).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowBids(true)}
            className="px-5 py-2 text-sm rounded-md border border-[#14a19f]/40 text-[#14a19f] hover:bg-[#14a19f]/10"
          >
            Show Bids
          </button>
        </div>
      </div>
    </>
  );
}

export default ClientOpenJobs;
