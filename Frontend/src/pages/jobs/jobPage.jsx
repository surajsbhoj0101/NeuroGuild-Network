import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useWalletClient } from "wagmi";
import axios from "axios";
import { useParams } from "react-router-dom";
import MatchScore from "../../components/MatchScore";
import CustomConnectButton from "../../components/CustomConnectButton";
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
      const job = await axios.get(
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
      const score = await axios.post(
        "http://localhost:5000/api/jobs/fetch-ai-score-and-job-interaction",
        { address, jobId }
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
      const res = await axios.put(
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
      freelancer: address.toLowerCase,
    };

    try {
      setSubmitingBid(true);
      let ipfs;

      try {
        const getProposalIpfs = await axios.post(
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
      <div className="dark:bg-[#0f111d]  flex bg-[#161c32] w-full">
        {/* floating notice */}
        {notice && (
          <div className="fixed top-4 right-4 z-50 animate-pulse">
            <div
              className={`flex items-center gap-3 bg-[#14a19f] text-white px-4 py-2 rounded shadow-lg border border-[#1ecac7]/30 ${
                redNotice
                  ? "bg-red-600 border-red-700"
                  : "bg-[#14a19f] border-[#1ecac7]/30"
              } `}
            >
              <div className="text-sm">{notice}</div>
              <button
                onClick={() => setNotice(null)}
                className="ml-2 text-xs text-white/90 px-2 py-1 rounded hover:opacity-90 transition-opacity"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {showClientProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-white w-full  bg-[#161c32]/50 max-w-lg shadow-2xl rounded-xl p-6 animate-fadeIn">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={
                    JSON.stringify(jobDetails._doc.companyDetails.logoUrl) ||
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
            <div className="bg-[#0d1224] w-full max-w-md rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Submit Your Bid
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Bid Amount (USD)
                  </label>
                  <input
                    name="amount"
                    value={bidData.amount}
                    onChange={handleChange}
                    type="number"
                    required
                    min={1}
                    className="w-full mt-1 p-3 rounded-lg border  dark:border-gray-600 bg-[#0b0f1d]  text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Proposal Details
                  </label>
                  <textarea
                    value={bidData.proposal}
                    name="proposal"
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full mt-1 p-3 rounded-lg border border-gray-600 bg-[#0b0f1d]  text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Describe how you will complete this job..."
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-end mt-6 gap-3">
                <button
                  disabled={isSubmittingBid}
                  onClick={() => setIsBidding(false)}
                  className={`px-4 py-2 rounded-lg border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#13182c] transition `}
                >
                  Cancel
                </button>

                <button
                  disabled={isSubmittingBid}
                  onClick={handleSubmitBid}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  {isSubmittingBid ? (
                    <div className="animate-pulse transition">
                      Submitting ...
                    </div>
                  ) : (
                    <div>Submit</div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-none fixed right-[5%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
        {/* <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div> */}

        <div className="flex min-h-screen gap-3 p-8 w-full">
          <div className=" w-[60%] space-y-6">
            <div className="border p-4 rounded-xl border-[#14a19f]/10">
              <h1
                style={orbitronStyle}
                className="text-3xl font-semibold text-white"
              >
                {jobDetails?.title}
              </h1>

              <div className="flex gap-4 p-2  text-gray-300 text-sm">
                <span className="bg-[#1b233d] px-3 py-1 rounded">
                  Intermediate
                </span>

                <span className="flex items-center gap-1">
                  <Clock size={16} /> {jobDetails?.createdAt?.slice(0, 10)}
                </span>

                <span className="flex items-center gap-1 text-red-300">
                  <Clock size={16} /> {jobDetails?.deadline?.slice(0, 10)}
                </span>

                <span className="flex items-center gap-1 text-blue-300">
                  <Clock size={16} />{" "}
                  {jobDetails?.completion?.slice(0, 10) ?? "—"}
                </span>

                <span className="flex items-center gap-1 text-white">
                  <User size={16} /> {totalApplied || 0}
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
                {jobDetails?.skills.map((skill, idx) => (
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

          <div className="hidden lg:flex  flex-col w-[40%] items-center">
            <div className="sticky w-4/5 top-3 flex flex-col justify-center space-y-3">
              <div className=" ">
                {isConnected ? (
                  fetchingScore ? (
                    <div className="flex flex-col items-center rounded-xl border border-[#14a19f]/10 px-6 py-6 space-y-4 animate-pulse">
                      <div className="h-6 w-48 bg-white/10 rounded-md" />
                      <div className="h-28 w-28 rounded-full bg-white/10" />
                      <div className="w-full flex gap-4">
                        <div className="w-1/2 h-12 bg-white/10 rounded-lg" />
                        <div className="w-1/2 h-12 bg-white/10 rounded-lg" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center rounded-xl border border-[#14a19f]/10 px-6 py-4 space-y-6">
                      <h1 className="text-3xl font-semibold text-white mb-2">
                        Apply for this Gig
                      </h1>

                      <div className="backdrop-blur-md border border-[#14a19f]/10 bg-[#161c32]/40 rounded-xl shadow-lg px-14 py-8 flex flex-col items-center">
                        <MatchScore score={score} />
                      </div>

                      <div className="w-full flex gap-4">
                        {jobInteraction.isApplied ? (
                          <button className="w-1/2 bg-transparent border-white border text-white font-semibold py-3 rounded-lg transition-colors">
                            Applied
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setIsBidding(true);
                            }}
                            className="w-1/2 bg-transparent text-[#14a19f] dark:text-white border border-[#14a19f] dark:border-[#0a184b] font-semibold py-3 rounded-lg hover:bg-[#14a19f]/10 dark:hover:bg-[#0d1c4e] transition-colors"
                          >
                            Apply
                          </button>
                        )}

                        {jobInteraction.isSaved ? (
                          <button className="w-1/2 bg-transparent border-white border text-white font-semibold py-3 rounded-lg transition-colors">
                            Saved
                          </button>
                        ) : (
                          <button
                            onClick={saveJob}
                            className="w-1/2 dark:bg-[#0a184b] dark:hover:bg-[#0a184b]/80 bg-[#14a19f] text-white font-semibold py-3 rounded-lg hover:bg-[#14a19f]/70 transition-colors"
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
                      <div className="flex relative flex-col items-center rounded-2xl border border-[#14a19f]/10 px-6 py-4 space-y-6 bg-[#0b1022]/50">
                        <h1 className="text-3xl font-semibold text-white mb-2">
                          Apply for this Gig
                        </h1>

                        <div className="backdrop-blur-md border border-[#14a19f]/10 bg-[#161c32]/40 rounded-xl shadow-lg px-14 py-8 flex flex-col items-center">
                          <MatchScore />
                        </div>

                        <div className="w-full flex gap-4">
                          <button className="w-1/2 dark:bg-[#0a184b] dark:hover:bg-[#0a184b]/80 bg-[#14a19f] text-white font-semibold py-3 rounded-lg hover:bg-[#14a19f]/70 transition-colors">
                            Apply Now
                          </button>
                          <button className="w-1/2 bg-transparent text-[#14a19f] dark:text-white border border-[#14a19f] dark:border-[#0a184b] font-semibold py-3 rounded-lg hover:bg-[#14a19f]/10 dark:hover:bg-[#0d1c4e] transition-colors">
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
                    setShowClientProfile(true);
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
