import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useWalletClient } from "wagmi";
import api from "../../utils/api.js"
import { useParams } from "react-router-dom";
import MatchScore from "../../components/MatchScore";
import CustomConnectButton from "../../components/CustomConnectButton";
import NoticeToast from "../../components/NoticeToast";
import { BrowserProvider } from "ethers";
import { submitBid } from "../../utils/submitBid";
import {
  Users,
  Lock,
  ScrollText,
  Star,
  Clock,
  Award,
  Plus,
  X,
  Check,
  User,
  Mail,
  MapPin,
  Github,
  Linkedin,
  Twitter,
  Globe,
} from "lucide-react";

function jobPage() {
  const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
  const robotoStyle = { fontFamily: "Roboto, sans-serif" };
  const [jobDetails, setJobDetails] = useState(null);
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();
  const { data: walletClient } = useWalletClient();
  const [bidData, setBidData] = useState({
    proposal: "",
    amount: "",
  });

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [isSubmittingBid, setSubmitingBid] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [totalApplied, setTotalApplied] = useState();
  const [clientHiringDetails, setClientHiringDetails] = useState({
    open: "",
    inProgress: "",
    Completed: "",
  });

  const { jobId } = useParams();
  const [jobInteraction, setJobInteraction] = useState({
    isSaved: false,
    isApplied: false,
  });

  const [fetchingScore, setFetchingScore] = useState(true);
  const [score, setScore] = useState(null);
  const bidAmountNumber = Number(bidData.amount || 0);
  const proposalLength = bidData.proposal.trim().length;
  const isBidFormValid = bidAmountNumber > 0 && proposalLength > 0;
  const normalizedJobStatus = (jobDetails?.status || "OPEN").toUpperCase();
  const isJobOpen = normalizedJobStatus === "OPEN";
  const readableJobStatus = normalizedJobStatus
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const createdDate = jobDetails?.createdAt
    ? new Date(jobDetails.createdAt).toLocaleDateString()
    : "—";
  const deadlineDate = jobDetails?.deadline
    ? new Date(jobDetails.deadline).toLocaleDateString()
    : "—";
  const completionDate = jobDetails?.completion
    ? new Date(jobDetails.completion).toLocaleDateString()
    : "—";

  async function getSigner() {
    let signer;
    if (walletClient) {
      const provider = new BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
    }
    return signer;
  }

  const fetchJob = async (params) => {
    try {
      const job = await api.get(
        `http://localhost:5000/api/jobs/fetch-job/${jobId}`,
        { withCredentials: true }
      );
      setJobDetails(job.data.jobDetails);
      setTotalApplied(job.data.totalBids);
    } catch (error) {
      console.log("Unable to find job details", error);
      setRedNotice(true);
      setNotice("Unable to fetch the job details");
      setTimeout(() => {
        navigate("/");
      }, 4000);
    }
  };

  const getMatchScore = async () => {
    console.log(jobDetails);
    if (!address) {
      setRedNotice(true);
      setNotice("Wallet not connected");
      return;
    }

    if (!jobId) {
      setRedNotice(true);
      setNotice("Job Id not found");
      return;
    }

    try {
      const score = await api.post(
        "http://localhost:5000/api/jobs/fetch-ai-score-and-job-interaction",
        { jobId }
      );

      setScore(score.data?.aiScore?.match_score);
      setJobInteraction({
        isSaved: score.data?.isSaved,
        isApplied: score.data?.isApplied,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setFetchingScore(false);
    }
  };

  async function saveJob(params) {
    if (!isJobOpen) {
      setRedNotice(true);
      setNotice(`This job is currently ${readableJobStatus.toLowerCase()}.`);
      return;
    }

    if (!address) {
      setRedNotice(true);
      setNotice("Wallet not connected");
      return;
    }

    if (!jobId) {
      setRedNotice(true);
      setNotice("Job Id not found");
      return;
    }

    try {
      const res = await api.put(
        "http://localhost:5000/api/jobs/save-job",
        {
          jobId,
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        setJobInteraction((prev) => ({
          ...prev,
          isSaved: true,
        }));
      }

      setRedNotice(false);
      setNotice("Job saved successfull");
    } catch (error) {
      console.log(error);
    }
  }

  async function handleSubmitBid() {
    if (!isJobOpen) {
      setRedNotice(true);
      setNotice(`This job is currently ${readableJobStatus.toLowerCase()}.`);
      return;
    }

    if (!address) {
      setRedNotice(true);
      setNotice("Wallet not connected");
      return;
    }

    if (!jobId) {
      setRedNotice(true);
      setNotice("Job Id not found");
      return;
    }

    if (!bidData.amount) {
      setRedNotice(true);
      setNotice("Amount cannot be empty");
      return;
    }

    if (bidData.proposal.length <= 0) {
      setRedNotice(true);
      setNotice("Proposal cannot be left empty");
      return;
    }

    const payload = {
      proposal: bidData.proposal.trim(),
      amount: bidData.amount ? Number(bidData.amount) : 0,
      freelancer: address?.toLowerCase(),
    };

    try {
      setSubmitingBid(true);
      let ipfs;

      try {
        const getProposalIpfs = await api.post(
          "http://localhost:5000/api/jobs/get-bid-proposal-ipfs",
          { payload }
        );

        ipfs = getProposalIpfs?.data?.ipfs;
        if (!ipfs || typeof ipfs !== "string" || ipfs.trim() === "") {
          setRedNotice(true);
          setNotice("Failed to upload job metadata to IPFS.");
          return;
        }
      } catch (error) {
        setRedNotice(true);
        setNotice("Unable to upload bid metadata.");
        return;
      }
      try {
        const signer = await getSigner();

        const res = await submitBid(signer, bidData.amount, jobId, ipfs);

        if (!res) {
          setRedNotice(true);
          setNotice("Bid submit failed");
          setSubmitingBid(false);
          return;
        }

        const clientRecipientId =
          jobDetails?.clientId || jobDetails?.user || jobDetails?._id;
        if (clientRecipientId) {
          try {
            await api.post(
              "http://localhost:5000/api/notifications/job-event",
              {
                eventType: "bid_submitted",
                recipientId: clientRecipientId,
                metadata: {
                  jobId,
                  amount: Number(bidData.amount),
                },
              },
              { withCredentials: true }
            );
          } catch (notificationError) {
            console.error("bid_submitted notification failed:", notificationError);
          }
        }

        setRedNotice(false);

        setNotice("Bid Submitted Successfully");

        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } catch (error) {
        console.log(error);
        setRedNotice(true);
        setNotice("Blockchain submit failed");
        setSubmitingBid(false);
        return;
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSubmitingBid(false);
      setIsBidding(false);
    }
  }

  useEffect(() => {
    if (jobId && isConnected) {
      getMatchScore();
    }
  }, [jobId, isConnected]);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  function sendToProfile() {
    navigate("/freelancer/my-profile");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setBidData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <>
      <div className="dark:bg-[#0f111d] flex bg-[#161c32] w-full overflow-x-hidden">
        <NoticeToast
          message={notice}
          isError={redNotice}
          onClose={() => setNotice(null)}
        />

        {showClientProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-white w-full bg-[#161c32]/70 max-w-lg mx-4 shadow-2xl rounded-xl p-5 md:p-6 animate-fadeIn">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={
                    jobDetails?.clientDetails?.companyDetails?.logoUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${jobDetails?.clientAddress}`
                  }
                  alt="Client Logo"
                  className="w-16 h-16 rounded-full border border-[#14a19f]/30 object-cover"
                />
                <div>
                  <h2 className="text-xl font-semibold">
                    {jobDetails?.clientDetails?.companyDetails?.companyName ||
                      "Anonymous"}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {jobDetails?.clientDetails?.companyDetails?.location ||
                      "Unknown Location"}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div
                  className=" bg-[#1be4e0]/40
                                    dark:bg-[#0a184b]/40 p-4 rounded-lg text-center"
                >
                  <p className="text-lg font-semibold">
                    {(clientHiringDetails?.open ?? 0) +
                      (clientHiringDetails?.Completed ?? 0) +
                      (clientHiringDetails?.inProgress ?? 0)}
                  </p>
                  <p className="text-gray-400 text-xs">Jobs Posted</p>
                </div>

                <div
                  className=" bg-[#1be4e0]/40
                                    dark:bg-[#0a184b]/40 p-4 rounded-lg text-center"
                >
                  <p className="text-lg font-semibold">
                    {Number(clientHiringDetails.Completed || 0) +
                      Number(clientHiringDetails.inProgress || 0) ?? 0}
                  </p>
                  <p className="text-gray-400 text-xs">Hired</p>
                </div>

                <div
                  className=" bg-[#1be4e0]/40
                                    dark:bg-[#0a184b]/40 p-4 rounded-lg text-center"
                >
                  <p className="text-lg font-semibold">
                    {clientHiringDetails?.Completed ?? 0}
                  </p>
                  <p className="text-gray-400 text-xs">Completed</p>
                </div>
              </div>

              {/* Ratings */}
              <div
                className=" bg-[#1be4e0]/40
                                    dark:bg-[#0a184b]/40 p-4 rounded-lg mb-6"
              >
                <p className="text-sm text-gray-400 mb-1">Rating</p>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-lg">★</span>
                  <p className="font-semibold text-lg">
                    {jobDetails?.clientDetails?.stats?.averageRating / 5 ??
                      "N/A"}
                  </p>
                </div>
              </div>

              <div
                className=" bg-[#1be4e0]/40
                                    dark:bg-[#0a184b]/30 p-4 rounded-lg mb-6"
              >
                <p className="text-sm text-gray-400 mb-1">About</p>
                <p className="text-gray-300 text-sm">
                  No description available
                </p>
              </div>

              <button
                onClick={() => setShowClientProfile(false)}
                className="w-full bg-[#1be4e0]/40
                                    dark:bg-[#0a184b]/40 hover:bg-[#1be4e0]/60 hover:dark:bg-[#0a184b]/60 transition-colors p-3 rounded-lg text-center font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {isBidding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0d1224] border border-[#14a19f]/20 w-full max-w-lg rounded-2xl shadow-2xl p-6">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Submit Your Bid</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {jobDetails?.title || "This job"} • Budget ${jobDetails?.budget || 0}
                  </p>
                </div>
                <button
                  disabled={isSubmittingBid}
                  onClick={() => setIsBidding(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-[#121936] border border-[#14a19f]/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-400">Bid Summary</p>
                <p className="text-lg font-semibold text-[#14a19f] mt-1">
                  ${bidAmountNumber > 0 ? bidAmountNumber : 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Keep it competitive and aligned with the scope.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Bid Amount (USD)</label>
                  <div className="mt-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      name="amount"
                      value={bidData.amount}
                      onChange={handleChange}
                      type="number"
                      required
                      min={1}
                      className="w-full pl-8 pr-3 py-3 rounded-lg border border-gray-600 bg-[#0b0f1d] text-white focus:ring-2 focus:ring-[#14a19f] outline-none"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">Proposal Details</label>
                    <span className="text-xs text-gray-500">{proposalLength} chars</span>
                  </div>
                  <textarea
                    value={bidData.proposal}
                    name="proposal"
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full mt-1 p-3 rounded-lg border border-gray-600 bg-[#0b0f1d] text-white focus:ring-2 focus:ring-[#14a19f] outline-none"
                    placeholder="Explain your approach, timeline, and expected deliverables..."
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 gap-3">
                <p className="text-xs text-gray-500">
                  {isBidFormValid
                    ? "Ready to submit."
                    : "Fill amount and proposal to submit."}
                </p>
                <div className="flex items-center gap-3">
                <button
                  disabled={isSubmittingBid}
                  onClick={() => setIsBidding(false)}
                  className="px-4 py-2 rounded-lg border border-gray-500 text-gray-300 hover:bg-[#13182c] transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  disabled={isSubmittingBid || !isBidFormValid}
                  onClick={handleSubmitBid}
                  className="px-5 py-2 rounded-lg bg-[#14a19f] text-white font-semibold hover:bg-[#1ecac7] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingBid ? (
                    <div className="animate-pulse transition">Submitting...</div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check size={16} />
                      Submit Bid
                    </div>
                  )}
                </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-none fixed right-[5%] bottom-[20%] w-105 h-105 rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen hidden md:block"></div>
        {/* <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div> */}

        <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row min-h-screen gap-4 p-4 md:p-6 lg:p-8">
          <div className="w-full lg:w-[60%] space-y-4 md:space-y-6 min-w-0">
            <div className="border p-4 rounded-xl border-[#14a19f]/10">
              <h1
                style={orbitronStyle}
                className="text-2xl md:text-3xl font-semibold text-white leading-tight"
              >
                {jobDetails?.title}
              </h1>

              <div className="mt-3 flex flex-wrap gap-2 text-gray-300 text-xs sm:text-sm">
                <span className="bg-[#1b233d] px-3 py-1 rounded-full border border-white/10">
                  Intermediate
                </span>

                <span className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 bg-white/3">
                  <Clock size={14} /> {createdDate}
                </span>

                <span className="flex items-center gap-1 rounded-full border border-red-300/20 px-3 py-1 bg-red-400/10 text-red-200">
                  <Clock size={14} /> {deadlineDate}
                </span>

                <span className="flex items-center gap-1 rounded-full border border-blue-300/20 px-3 py-1 bg-blue-400/10 text-blue-200">
                  <Clock size={14} /> {completionDate}
                </span>

                <span className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 bg-white/3 text-white">
                  <User size={14} /> {totalApplied || 0} Applied
                </span>
              </div>
            </div>

            <div className="backdrop-blur-md border border-[#14a19f]/10 shadow-2xl p-5 rounded-xl text-gray-200 leading-relaxed">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <ScrollText
                  size={24}
                  className="text-[#14a19f] dark:text-white"
                />{" "}
                Job Description
              </h2>
              <p className="text-gray-200 py-2 leading-relaxed whitespace-pre-wrap">
                {jobDetails?.description}
              </p>
            </div>

            <div className="backdrop-blur-md border border-[#14a19f]/10  shadow-2xl p-5 rounded-xl text-gray-200">
              <h2 className="text-xl font-semibold text-white mb-3">
                Required Skills
              </h2>
              <div className="flex gap-2 flex-wrap">
                {(jobDetails?.skills || []).map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-[#1be4e0]/50 
                                    dark:bg-[#0a184b] 
                                   
                                    px-3 py-1 rounded-xl font-semibold text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="backdrop-blur-md border border-[#14a19f]/10 shadow-2xl p-5 rounded-xl text-gray-200">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Award size={20} className="text-[#14a19f] dark:text-[white]" />
                Budget
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#14a19f] dark:text-white">
                  ${jobDetails?.budget}
                </span>
                <span className="text-gray-400">USD</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full lg:w-[40%] items-stretch">
            <div className="lg:sticky lg:top-3 flex flex-col justify-center space-y-3 lg:px-2">
              <div className=" ">
                {isJobOpen ? (
                  isConnected ? (
                    fetchingScore ? (
                      <div className="flex flex-col items-center rounded-xl border border-[#14a19f]/10 px-4 md:px-6 py-6 space-y-4 animate-pulse">
                        <div className="h-6 w-48 bg-white/10 rounded-md" />
                        <div className="h-28 w-28 rounded-full bg-white/10" />
                        <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-4">
                          <div className="w-1/2 h-12 bg-white/10 rounded-lg" />
                          <div className="w-1/2 h-12 bg-white/10 rounded-lg" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center rounded-xl border border-[#14a19f]/10 px-4 md:px-6 py-4 space-y-5">
                        <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1 text-center">
                          Apply for this Gig
                        </h1>

                        <div className="w-full backdrop-blur-md border border-[#14a19f]/10 bg-[#161c32]/40 rounded-xl shadow-lg px-6 py-6 flex flex-col items-center">
                          <MatchScore score={score} />
                        </div>

                        <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-4">
                          {jobInteraction.isApplied ? (
                            <button className="w-full sm:w-1/2 bg-transparent border-white border text-white font-semibold py-3 rounded-lg transition-colors">
                              Applied
                            </button>
                          ) : (
                            <button
                              onClick={() => setIsBidding(true)}
                              className="w-full sm:w-1/2 bg-transparent text-[#14a19f] dark:text-white border border-[#14a19f] dark:border-[#0a184b] font-semibold py-3 rounded-lg hover:bg-[#14a19f]/10 dark:hover:bg-[#0d1c4e] transition-colors"
                            >
                              Apply
                            </button>
                          )}

                          {jobInteraction.isSaved ? (
                            <button className="w-full sm:w-1/2 bg-transparent border-white border text-white font-semibold py-3 rounded-lg transition-colors">
                              Saved
                            </button>
                          ) : (
                            <button
                              onClick={saveJob}
                              className="w-full sm:w-1/2 dark:bg-[#0a184b] dark:hover:bg-[#0a184b]/80 bg-[#14a19f] text-white font-semibold py-3 rounded-lg hover:bg-[#14a19f]/70 transition-colors"
                            >
                              Save for later
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="relative">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none select-none blur-md"
                      >
                        <div className="flex relative flex-col items-center rounded-2xl border border-[#14a19f]/10 px-4 md:px-6 py-4 space-y-5 bg-[#0b1022]/50">
                          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1 text-center">
                            Apply for this Gig
                          </h1>

                          <div className="w-full backdrop-blur-md border border-[#14a19f]/10 bg-[#161c32]/40 rounded-xl shadow-lg px-6 py-6 flex flex-col items-center">
                            <MatchScore />
                          </div>

                          <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <button className="w-full sm:w-1/2 dark:bg-[#0a184b] dark:hover:bg-[#0a184b]/80 bg-[#14a19f] text-white font-semibold py-3 rounded-lg hover:bg-[#14a19f]/70 transition-colors">
                              Apply Now
                            </button>
                            <button className="w-full sm:w-1/2 bg-transparent text-[#14a19f] dark:text-white border border-[#14a19f] dark:border-[#0a184b] font-semibold py-3 rounded-lg hover:bg-[#14a19f]/10 dark:hover:bg-[#0d1c4e] transition-colors">
                              Save for Later
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b132b]/70 backdrop-blur-xl shadow-2xl p-6 text-center">
                          <div className="mx-auto mb-4 h-12 w-12 grid place-items-center rounded-full bg-white/10">
                            <Lock className="h-6 w-6 text-white" />
                          </div>

                          <h2 className="text-white text-lg font-semibold">
                            Create your profile to see this
                          </h2>
                          <p className="mt-1 text-sm text-gray-300">
                            Unlock match score, apply instantly, and save gigs.
                          </p>

                          <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                              onClick={sendToProfile}
                              className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold text-white dark:bg-[#0a184b] bg-[#14a19f] hover:bg-[#14a19f]/90 hover:dark:bg-[#0a184b]/90 transition"
                            >
                              Create Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-6 py-6 text-center">
                    <h1 className="text-3xl font-semibold text-white mb-4">
                      Job Status
                    </h1>
                    <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/12 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">
                      {readableJobStatus}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-gray-300">
                      This job is no longer open, so applying and saving are unavailable.
                    </p>
                  </div>
                )}
              </div>

              <div className="border p-3 border-[#14a19f]/10 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">
                  About the Client
                </h3>

                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={
                      jobDetails?.companyDetails?.logoUrl ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${jobDetails?.clientAddress}`
                    }
                    alt="Client Logo"
                    className="w-16 h-16 rounded-full border border-[#14a19f]/30 object-cover"
                  />

                  <div className="flex flex-col gap-2 text-sm">
                    <span className="font-semibold text-lg text-gray-100">
                      {jobDetails?.companyDetails?.companyName}
                    </span>

                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-yellow-400">
                        <Star size={18} fill="currentColor" />
                      </span>
                      <span className="text-sm font-medium text-white">
                        {jobDetails?.stats?.averageRating}/5 Average Rating
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const profileTarget =
                      jobDetails?.clientId || jobDetails?.user || jobDetails?._id;
                    if (profileTarget) {
                      navigate(`/profile/${profileTarget}`);
                    }
                  }}
                  className="w-full bg-transparent text-[#14a19f] dark:text-white border border-[#14a19f] dark:border-[#0a184b] font-semibold py-2 rounded-lg hover:bg-[#14a19f]/10 dark:hover:bg-[#0d1c4e] transition-colors"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default jobPage;
