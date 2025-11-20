import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAccount, useWalletClient } from 'wagmi';
import SideBar from '../../components/SideBar';
import axios from "axios";
import "../../index.css"
import { BrowserProvider } from 'ethers';
import { postJob } from '../../utils/post_job';
// import { funkiMainnet } from 'viem/chains';



function PostJobs() {
    const { isConnected, address } = useAccount();
    const navigate = useNavigate();
    const timeoutRef = useRef(null);

    const [enhancing, setEnhancing] = useState(false)
    const [applying, setApplying] = useState(false);
    const [submiting, setSubmiting] = useState(false)
    const [cancelling, setCancelling] = useState(false);
    const { data: walletClient } = useWalletClient();

    const [notice, setNotice] = useState(null);
    const [redNotice, setRedNotice] = useState(false);

    const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
    const robotoStyle = { fontFamily: "Roboto, sans-serif" };

    const initialJobDetails = {
        title: "",
        jobDescription: "",
        skills: [],
        experienceLevel: "",
        budgetType: "fixed",
        budget: "",
        deadline: "",
        completion: ""
    };

    const [jobDetails, setJobDetails] = useState(initialJobDetails);

    const [enhanced, setEnhanced] = useState(null);

    const PreviewJobDetails = enhanced ?? jobDetails; //nullish coalesing

    const [skillInput, setSkillInput] = useState("");
    const DESCRIPTION_MAX = 800;


    useEffect(() => {
        if (!isConnected) {
            setRedNotice(true);
            setNotice("Wallet not connected — redirecting to home...");
            timeoutRef.current = setTimeout(() => navigate("/"), 1600);
        } else if (address) {
            setNotice(null);
        }
        return () => clearTimeout(timeoutRef.current);
    }, [isConnected, navigate, address]);


    const handleInputChange = (field, value) => {
        if (field === "jobDescription") {
            const trimmed = value.slice(0, DESCRIPTION_MAX);
            setJobDetails((prev) => ({ ...prev, jobDescription: trimmed }));
            return;
        }
        setJobDetails((prev) => ({ ...prev, [field]: value }));
    };

    async function getSigner(params) {
        let signer;
        if (walletClient) {
            const provider = new BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
        }
        return signer;
    }


    const sanitizeSkill = (raw) => raw.trim().replace(/\s+/g, " ");

    /* Normalize dates for HTML date inputs and comparisons */
    const toDateInputValue = (val) => {
        if (!val) return "";
        const d = new Date(val);
        if (isNaN(d.getTime())) return "";
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    const normalizeEnhancedDates = (obj = {}) => {
        const copy = { ...obj };
        if (copy.deadline) copy.deadline = toDateInputValue(copy.deadline);
        if (copy.completion) copy.completion = toDateInputValue(copy.completion);
        return copy;
    };


    // ADD SKILL
    const addSkill = useCallback(
        (e) => {
            if (e?.preventDefault) e.preventDefault();
            const val = sanitizeSkill(skillInput);
            if (!val) return;

            const exists = jobDetails.skills.some(
                (s) => s.toLowerCase() === val.toLowerCase()
            );
            if (exists) {
                setNotice("Skill already added");
                setRedNotice(true);
                timeoutRef.current = setTimeout(() => setNotice(null), 1200);
                setSkillInput("");
                return;
            }

            setJobDetails((prev) => ({
                ...prev,
                skills: [...prev.skills, val],
            }));
            setSkillInput("");
        },
        [skillInput, jobDetails.skills]
    );

    const removeSkill = (skill) => {
        setJobDetails((prev) => ({
            ...prev,
            skills: prev.skills.filter((s) => s !== skill),
        }));
    };


    const handleAIEnhance = async () => {

        if (!address) {
            setRedNotice(true);
            setNotice("Wallet address missing");
            return;
        }
        if (!jobDetails.title.trim()) {
            setRedNotice(true);
            setNotice("Please add a job title");
            return;
        }
        if (!jobDetails.jobDescription.trim()) {
            setRedNotice(true);
            setNotice("Please add a job description");
            return;
        }

        if (!jobDetails.deadline) {
            setRedNotice(true);
            setNotice("Add the Bid deadline")
            return
        }

        if (!jobDetails.completion) {
            setRedNotice(true);
            setNotice("Add the Completion deadline")
            return
        }

        const payload = {
            title: jobDetails.title.trim(),
            description: jobDetails.jobDescription.trim(),
            skills: jobDetails.skills,
            experienceLevel: jobDetails.experienceLevel || "not-specified",
            deadline: jobDetails.deadline,
            completion: jobDetails.completion,
            budget:jobDetails.budget
        };

        try {
            setEnhancing(true)
            const res = await axios.post(
                "http://localhost:5000/api/jobs/ai-enhancement",
                { payload }
            );

            console.log(res.data.enhanced);
            if (res?.data?.enhanced) {
                // normalize date fields so they work with <input type="date">
                setEnhanced(normalizeEnhancedDates(res.data.enhanced));
                setRedNotice(false)
                setNotice("AI enhancement applied (preview only)");
            } else {
                setRedNotice(true);
                setNotice("AI did not return enhancement");
            }
        } catch (error) {
            console.log("AI Enhancement Error:", error);
            setRedNotice(true);
            setNotice("Failed to enhance using AI");
        } finally {
            setEnhancing(false)
        }
    };

    const handleApplyPreview = () => {
        setApplying(true)
        if (!enhanced) {
            setNotice("No AI preview to apply");
            setRedNotice(true);
            setApplying(false)
            return;
        }
        // apply normalized preview (dates are YYYY-MM-DD)
        setJobDetails((prev) => ({ ...prev, ...enhanced }));
        setEnhanced(null);
        setApplying(false)
    };


    const submitJob = useCallback(async () => {
        const signer = await getSigner();
        if (!signer) {
            setRedNotice(true);
            setNotice("Please connect your wallet first.");
            return;
        }

        if (!address) {
            setRedNotice(true);
            setNotice("Wallet address missing");
            return;
        }
        if (!jobDetails.title.trim()) {
            setRedNotice(true);
            setNotice("Please add a job title");
            return;
        }
        if (!jobDetails.jobDescription.trim()) {
            setRedNotice(true);
            setNotice("Please add a job description");
            return;
        }
        if (!jobDetails.skills.length) {
            setRedNotice(true);
            setNotice("Add at least one skill");
            return;
        }

        if (!jobDetails.deadline) {
            setRedNotice(true);
            setNotice("Add the Bid deadline")
            return
        }

        if (!jobDetails.completion) {
            setRedNotice(true);
            setNotice("Add the Completion deadline")
            return
        }

        const dl = new Date(jobDetails.deadline);
        const cl = new Date(jobDetails.completion);
        if (isNaN(dl.getTime()) || isNaN(cl.getTime())) {
            setRedNotice(true);
            setNotice("Invalid deadlines. Use YYYY-MM-DD format.");
            return;
        }
        if (dl.getTime() >= cl.getTime()) {
            setRedNotice(true);
            setNotice("Job completion deadline must be after bidding deadline");
            return;
        }

        // convert date inputs to ISO strings for backend / ipfs
        const dlISO = !jobDetails.deadline ? null : new Date(jobDetails.deadline).toISOString();
        const compISO = !jobDetails.completion ? null : new Date(jobDetails.completion).toISOString();

        const payload = {
            title: jobDetails.title.trim(),
            description: jobDetails.jobDescription.trim(),
            skills: jobDetails.skills,
            experienceLevel: jobDetails.experienceLevel || "not-specified",
            budget: jobDetails.budget ? Number(jobDetails.budget) : 0,
            deadline: dlISO,
            completion: compISO,
            clientAddress: address,
            createdAt: new Date().toISOString(),
        };

        console.log(payload)


        try {
            setSubmiting(true);

            let jobipfs;


            try {
                const res = await axios.post(
                    "http://localhost:5000/api/jobs/get-job-ipfs",
                    { payload }
                );

                jobipfs = res.data?.ipfs;

                if (!jobipfs || typeof jobipfs !== "string" || jobipfs.trim() === "") {
                    setRedNotice(true);
                    setNotice("Failed to upload job metadata to IPFS.");
                    return;
                }
            } catch (error) {
                setRedNotice(true);
                setNotice("Unable to upload job metadata.");
                return;
            }


         

            try {
                const tx = await postJob(
                    signer,
                    jobipfs,
                    jobDetails.budget,
                    jobDetails.deadline,
                    jobDetails.completion
                );
                if (!tx) {
                    setRedNotice(true);
                    setNotice("Blockchain error: job not created.");
                    return;
                }

            } catch (err) {
                console.error("Blockchain transaction failed:", err);
                setRedNotice(true);
                setNotice("Transaction failed or rejected.");
                return;
            }


            try {
                const res = await axios.post(
                    "http://localhost:5000/api/jobs/create-job",
                    { payload }
                );

                if (res?.data?.success) {
                    setRedNotice(false);
                    setNotice("Job posted successfully!");
                } else {
                    setRedNotice(true);
                    setNotice(res?.data?.message || "Failed to save job in backend.");
                }

            } catch (err) {
                console.error("Backend save failed:", err);
                setRedNotice(true);
                setNotice("Failed to save job in backend.");
                return;
            }

        } catch (err) {
            setRedNotice(true);
            setNotice("Unexpected error. Try again.");
        } finally {
            setSubmiting(false);
        }

    }, [address, jobDetails, navigate]);

    function removeAllDetails() {
        setCancelling(true);
        setEnhanced(null);
        setJobDetails(initialJobDetails);
        setCancelling(false)
    }

    return (
        <>
            {submiting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-t-[#14a19f] border-gray-700 rounded-full animate-spin"></div>
                        <div className="text-sm text-white">Please wait…</div>
                    </div>
                </div>
            )}
            {notice && (
                <div className="fixed top-4 right-4 z-50 animate-pulse">
                    <div className={`flex items-center gap-3 bg-[#14a19f] text-white px-4 py-2 rounded shadow-lg border border-[#1ecac7]/30 ${redNotice ? 'bg-red-600 border-red-700' : 'bg-[#14a19f] border-[#1ecac7]/30'} `}>
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

            <div className="min-h-screen  dark:bg-[#0f111d]  bg-[#161c32]">
                {/* Background effects */}
                <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
                <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>

                <div className="flex">

                    <SideBar />


                    <div className="flex flex-1 gap-6 p-6">

                        <div className="w-full lg:w-[60%] space-y-6">
                            <h1 style={orbitronStyle} className="text-3xl text-white font-bold">
                                Create a New Gig
                            </h1>

                            {/* BASICS */}
                            <div className="w-full backdrop-blur-sm flex-col flex space-y-5 rounded-lg p-6 mb-6 border border-[#14a19f]/20">
                                <h2 style={orbitronStyle} className='text-white text-xl font-bold mb-4 tracking-wide'>
                                    Basics
                                </h2>

                                {/* Job Title */}
                                <div className='flex flex-col'>
                                    <label
                                        className="text-gray-200 text-sm font-semibold flex items-center gap-2"
                                        style={robotoStyle}
                                    >
                                        <span className="w-1 h-4 bg-[#14a19f] rounded-full"></span>
                                        Job Title
                                    </label>

                                    <input
                                        type='text'
                                        value={jobDetails.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="Enter job title..."
                                        className="w-full backdrop-blur-lg  text-white px-4 py-3 rounded-lg border border-white/10 hover:border-[#14a19f]/30 focus:border-[#14a19f] focus:ring-2 focus:ring-[#14a19f]/20 outline-none transition-all placeholder:text-gray-500 shadow-inner"
                                        style={robotoStyle}
                                    />
                                </div>

                                {/* Job Description */}
                                <div className='flex flex-col'>
                                    <label
                                        className="text-gray-200 text-sm font-semibold flex items-center gap-2"
                                        style={robotoStyle}
                                    >
                                        <span className="w-1 h-4 bg-[#14a19f] rounded-full"></span>
                                        Job Description
                                    </label>

                                    <textarea
                                        value={jobDetails.jobDescription}
                                        onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                                        rows={6}
                                        placeholder="Describe requirements, responsibilities, expected deliverables, timeline..."
                                        className="w-full backdrop-blur-lg text-white px-4 py-3 rounded-lg border border-white/10 hover:border-[#14a19f]/30 focus:border-[#14a19f] focus:ring-2 focus:ring-[#14a19f]/20 outline-none transition-all placeholder:text-gray-500 resize-none shadow-inner"
                                        style={robotoStyle}
                                        maxLength={DESCRIPTION_MAX}
                                    />

                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <p>Provide details. Better clarity attracts better talent.</p>
                                        <span>{jobDetails.jobDescription.length}/{DESCRIPTION_MAX}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Requirements */}
                            <div className="w-full backdrop-blur-sm flex-col flex space-y-5 rounded-lg p-6 mb-6 border border-[#14a19f]/20">
                                <h2 style={orbitronStyle} className='text-white text-xl font-bold mb-4 tracking-wide'>
                                    Requirements
                                </h2>

                                {/* Experience */}
                                <div className='flex flex-col'>
                                    <label className="text-gray-200 text-sm font-semibold flex items-center gap-2" style={robotoStyle}>
                                        <span className="w-1 h-4 bg-[#14a19f] rounded-full"></span>
                                        Experience Level
                                    </label>

                                    <select
                                        value={jobDetails.experienceLevel}
                                        onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                                        className="w-full dark:bg-gray-900 bg-cyan-600 backdrop-blur-md  text-white px-6 py-3 rounded-lg border border-[#1a2a38] hover:border-[#14a19f]/30 hover:bg-gray-800 focus:border-[#14a19f] outline-none shadow-inner"
                                    >
                                        <option value="">Select experience</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </div>


                                <div className='flex flex-col'>
                                    <label
                                        className="text-gray-200 text-sm font-semibold flex items-center gap-2"
                                        style={robotoStyle}
                                    >
                                        <span className="w-1 h-4 bg-[#14a19f] rounded-full"></span>
                                        Bid Deadline
                                    </label>

                                    <input
                                        type="date"
                                        value={jobDetails.deadline}
                                        onChange={(e) => handleInputChange('deadline', e.target.value)}
                                        className="
                                            w-full backdrop-blur-md text-white px-4 py-3 rounded-lg 
                                            border border-[#1a2a38]
                                            hover:border-[#14a19f]/30 
                                            focus:border-[#14a19f] focus:ring-2 focus:ring-[#14a19f]/20 
                                            outline-none shadow-inner
                                            transition-all
                                            [&::-webkit-calendar-picker-indicator]:cursor-pointer
        "
                                        style={{ fontFamily: robotoStyle.fontFamily }}
                                    />

                                </div>

                                <div className='flex flex-col'>
                                    <label
                                        className="text-gray-200 text-sm font-semibold flex items-center gap-2"
                                        style={robotoStyle}
                                    >
                                        <span className="w-1 h-4 bg-[#14a19f] rounded-full"></span>
                                        Completion Deadline
                                    </label>

                                    <input
                                        type="date"
                                        value={jobDetails.completion}
                                        onChange={(e) => handleInputChange('completion', e.target.value)}
                                        className="
                                            w-full backdrop-blur-md text-white px-4 py-3 rounded-lg 
                                            border border-[#1a2a38]
                                            hover:border-[#14a19f]/30 
                                            focus:border-[#14a19f] focus:ring-2 focus:ring-[#14a19f]/20 
                                            outline-none shadow-inner
                                            transition-all
                                            [&::-webkit-calendar-picker-indicator]:cursor-pointer
        "
                                        style={{ fontFamily: robotoStyle.fontFamily }}
                                    />

                                </div>
                            </div>


                            <div className="w-full backdrop-blur-sm flex-col flex space-y-5 rounded-lg p-6 border border-[#14a19f]/20">
                                <h2 style={orbitronStyle} className='text-white text-xl font-bold mb-4 tracking-wide'>
                                    Skills & Budget
                                </h2>

                                <div className='flex flex-col'>
                                    <label className="text-gray-200 text-sm font-semibold flex items-center gap-2">
                                        <span className="w-1 h-4 bg-[#14a19f] rounded-full"></span>
                                        Required Skills
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="e.g. Solidity, React, Hardhat..."
                                        className="w-full backdrop-blur-3xl text-white px-4 py-3 rounded-lg border border-[#1a2a38] hover:border-[#14a19f]/30 focus:border-[#14a19f] outline-none shadow-inner"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSkill(e);
                                            }
                                        }}
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                    />

                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {jobDetails.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="bg-[#14a19f]/20 text-[#14a19f] text-xs px-3 py-1 rounded-full border border-[#14a19f]/30 cursor-pointer"
                                                onClick={() => removeSkill(skill)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') removeSkill(skill); }}
                                            >
                                                {skill} ✕
                                            </span>
                                        ))}
                                    </div>
                                </div>




                                {/* Budget */}
                                <div className='flex flex-col'>
                                    <label className="text-gray-200 text-sm font-semibold flex items-center gap-2">
                                        <span className="w-1 h-4 bg-[#14a19f] rounded-full"></span>
                                        Budget In USD ($)
                                    </label>

                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="e.g. 10$"
                                        value={jobDetails.budget}
                                        onChange={(e) => handleInputChange('budget', e.target.value)}
                                        className="w-full backdrop-blur-3xl text-white px-4 py-3 rounded-lg border border-[#1a2a38] hover:border-[#14a19f]/30 focus:border-[#14a19f] outline-none shadow-inner"
                                    />
                                </div>


                            </div>

                            <div className="w-full mb-7 mt-3 backdrop-blur-sm flex items-center justify-between rounded-lg p-6 border border-[#14a19f]/20 space-x-4">
                                <button
                                    onClick={removeAllDetails}
                                    disabled={enhancing || applying || submiting || cancelling}
                                    className="flex-1 px-4 py-3 rounded-lg border border-[#14a19f]/30 text-gray-300 hover:bg-[#14a19f]/20 hover:border-[#14a19f] transition-colors"
                                >
                                    {cancelling ? (
                                        <span className="animate-pulse">Removing...</span>
                                    ) : (
                                        "Remove"
                                    )}
                                </button>

                                <button
                                    onClick={submitJob}
                                    disabled={enhancing || applying || submiting || cancelling}
                                    className="flex-1 px-4 py-3 rounded-lg bg-[#14a19f] text-white font-semibold hover:bg-[#0cc9c6] transition-colors"
                                >
                                    {submiting ?
                                        (<span className="animate-pulse">Submitting...</span>) : (
                                            "Submit"
                                        )}
                                </button>
                            </div>

                        </div>

                        {/* right */}
                        <div className="hidden lg:block w-[40%]">
                            <div className="sticky top-6">
                                <div className="backdrop-blur-lg flex flex-col  border border-[#14a19f]/20 rounded-xl p-6 shadow-xl text-white space-y-6">
                                    <h2 className="text-xl font-bold tracking-wide" style={orbitronStyle}>
                                        Gig Preview
                                    </h2>


                                    <div className='flex flex-col '>
                                        <h3 className="text-2xl font-semibold text-[#14a19f]">
                                            {PreviewJobDetails.title || "Untitled Gig"}
                                        </h3>


                                        {jobDetails.experienceLevel && (
                                            <span className="text-xs w-fit  px-2 py-1 bg-[#14a19f]/20 border border-[#14a19f]/50 rounded-full text-[#14a19f]">
                                                {PreviewJobDetails.experienceLevel}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {PreviewJobDetails.jobDescription || "Job description will appear here..."}
                                    </p>

                                    {/* Skills */}
                                    {PreviewJobDetails.skills.length > 0 && (
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Required Skills:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {PreviewJobDetails.skills.map((skill, i) => (
                                                    <span
                                                        key={i}
                                                        className="bg-[#14a19f]/15 text-[#14a19f] text-xs px-2 py-1 border border-[#14a19f]/30 rounded-full"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}



                                    {PreviewJobDetails.deadline && (
                                        <div className="text-sm text-gray-400">
                                            <span className="font-semibold text-white">Deadline:</span>{" "}
                                            {jobDetails.deadline}
                                        </div>
                                    )}


                                    {PreviewJobDetails.budget && (
                                        <div className="text-lg font-bold text-[#14a19f]">
                                            Budget: <span className="text-white">${jobDetails.budget}</span>
                                        </div>
                                    )}

                                    {/* Status */}
                                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                        <span className="w-2 h-2 bg-[#14a19f] rounded-full animate-pulse"></span>
                                        Live Preview Updating...
                                    </div>

                                    <div className="flex gap-4 mt-4">
                                        <button
                                            className="flex-1 px-4 py-2 rounded-lg border border-[#14a19f]/40 text-[#14a19f] hover:bg-[#14a19f]/20 backdrop-blur-2xl transition"
                                            onClick={handleAIEnhance}
                                            disabled={enhancing || applying || submiting || cancelling}
                                        >
                                            {enhancing ? (
                                                <span className="animate-pulse">Enhancing...</span>
                                            ) : (
                                                "Enhance With AI"
                                            )}
                                        </button>

                                        <button
                                            className="flex-1 text-white px-4 py-2 rounded-lg bg-[#14a19f] font-semibold hover:bg-[#10c5c2] transition disabled:opacity-50"
                                            onClick={handleApplyPreview}
                                            disabled={enhancing || applying || submiting || cancelling}
                                        >
                                            {applying ? (
                                                <span className="animate-pulse">Applying...</span>
                                            ) : (
                                                "Apply Preview"
                                            )}
                                        </button>
                                    </div>



                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}

export default PostJobs