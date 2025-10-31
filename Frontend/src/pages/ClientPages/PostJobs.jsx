import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import SideBar from '../../components/SideBar';
import axios from "axios";
import "../../index.css"

function PostJobs() {
    const { isConnected, address } = useAccount();
    const navigate = useNavigate();
    const [notice, setNotice] = useState(null);
    const [redNotice, setRedNotice] = useState(false);
    const timeoutRef = useRef(null);

    const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
    const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

    const [jobDetails, setJobDetails] = useState({
        title: '',
        jobDescription: '',
        skills: [],
        experienceLevel: '',
        budgetType: 'fixed',
        budget: '',
        deadline: '',
    });

    const [skillInput, setSkillInput] = useState('');
    const DESCRIPTION_MAX = 800;

    useEffect(() => {
        if (!isConnected) {
            setRedNotice(true);
            setNotice("Wallet not connected — redirecting to home...");
            timeoutRef.current = setTimeout(() => navigate('/'), 1600);
        } else if (address) {
            setNotice(null);
        }
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isConnected, navigate, address]);

    const handleInputChange = useCallback((field, value) => {
        if (field === 'jobDescription') {
            const trimmed = value.slice(0, DESCRIPTION_MAX);
            setJobDetails(prev => ({ ...prev, jobDescription: trimmed }));
            return;
        }
        setJobDetails(prev => ({ ...prev, [field]: value }));
    }, []);

    const sanitizeSkill = (raw) => {
        return raw.trim().replace(/\s+/g, ' ');
    };

    const addSkill = useCallback((e) => {
        if (e && e.preventDefault) e.preventDefault();
        const val = sanitizeSkill(skillInput);
        if (!val) return;
        // avoid duplicates (case-insensitive)
        const exists = jobDetails.skills.some(s => s.toLowerCase() === val.toLowerCase());
        if (exists) {
            setNotice('Skill already added');
            setRedNotice(true);
            timeoutRef.current = setTimeout(() => setNotice(null), 1200);
            setSkillInput('');
            return;
        }
        setJobDetails(prev => ({ ...prev, skills: [...prev.skills, val] }));
        setSkillInput('');
    }, [skillInput, jobDetails.skills]);

    const removeSkill = useCallback((skill) => {
        setJobDetails(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    }, []);

    const submitJob = useCallback(async () => {
        // basic validation
        if (!address) {
            setRedNotice(true);
            setNotice('Wallet address missing');
            setTimeout(() => setNotice(null), 1400);
            return false;
        }
        if (!jobDetails.title.trim()) {
            setRedNotice(true);
            setNotice('Please add a job title');
            setTimeout(() => setNotice(null), 1400);
            return false;
        }
        if (!jobDetails.jobDescription.trim()) {
            setRedNotice(true);
            setNotice('Please add a job description');
            setTimeout(() => setNotice(null), 1400);
            return false;
        }
        if (!jobDetails.skills.length) {
            setRedNotice(true);
            setNotice('Please add at least one skill');
            setTimeout(() => setNotice(null), 1400);
            return false;
        }

        // prepare payload
        const payload = {
            title: jobDetails.title.trim(),
            description: jobDetails.jobDescription.trim(),
            skills: jobDetails.skills,
            experienceLevel: jobDetails.experienceLevel || 'not-specified',
            budgetType: jobDetails.budgetType,
            budget: jobDetails.budget ? Number(jobDetails.budget) : 0,
            deadline: jobDetails.deadline || null,
            clientAddress: address,
            createdAt: new Date().toISOString(),
        };

        try {
            const res = await axios.post('http://localhost:5000/api/jobs/create', payload);
            if (res?.data?.success) {
                setRedNotice(false);
                setNotice('Job posted successfully!');
                timeoutRef.current = setTimeout(() => {
                    setNotice(null);
                    navigate('/dashboard');
                }, 1400);
                return true;
            } else {
                setRedNotice(true);
                setNotice(res?.data?.message || 'Failed to post job');
                timeoutRef.current = setTimeout(() => setNotice(null), 1800);
                return false;
            }
        } catch (err) {
            console.error('Error posting job:', err);
            setRedNotice(true);
            setNotice('Failed to post job. Please try again.');
            timeoutRef.current = setTimeout(() => setNotice(null), 1800);
            return false;
        }
    }, [address, jobDetails, navigate]);

    
    

    return (
        <>
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

                            {/* REQUIREMENTS */}
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
                                        className="w-full backdrop-blur-3xl text-white px-4 py-3 rounded-lg border border-[#1a2a38] hover:border-[#14a19f]/30 focus:border-[#14a19f] outline-none shadow-inner"
                                    >
                                        <option value="">Select experience</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </div>

                                {/* Deadline */}
                                <div className='flex flex-col'>
                                    <label
                                        className="text-gray-200 text-sm font-semibold flex items-center gap-2"
                                        style={robotoStyle}
                                    >
                                        <span className="w-1 h-4 bg-[#14a19f] rounded-full"></span>
                                        Deadline
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
                                    className="flex-1 px-4 py-3 rounded-lg border border-[#14a19f]/30 text-gray-300 hover:bg-[#14a19f]/20 hover:border-[#14a19f] transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    className="flex-1 px-4 py-3 rounded-lg bg-[#14a19f] text-white font-semibold hover:bg-[#0cc9c6] transition-colors"
                                >
                                    Post Job
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
                                            {jobDetails.title || "Untitled Gig"}
                                        </h3>


                                        {jobDetails.experienceLevel && (
                                            <span className="text-xs w-fit  px-2 py-1 bg-[#14a19f]/20 border border-[#14a19f]/50 rounded-full text-[#14a19f]">
                                                {jobDetails.experienceLevel}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {jobDetails.jobDescription || "Job description will appear here..."}
                                    </p>

                                    {/* Skills */}
                                    {jobDetails.skills.length > 0 && (
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Required Skills:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {jobDetails.skills.map((skill, i) => (
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


                                    {jobDetails.deadline && (
                                        <div className="text-sm text-gray-400">
                                            <span className="font-semibold text-white">Deadline:</span>{" "}
                                            {jobDetails.deadline}
                                        </div>
                                    )}


                                    {jobDetails.budget && (
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
                                        // onClick={handleAIEnhance}
                                        >
                                            Enhance With AI
                                        </button>

                                        <button
                                            className="flex-1 text-white px-4 py-2 rounded-lg bg-[#14a19f]  font-semibold hover:bg-[#10c5c2] transition"
                                        // onClick={handleApplyPreview}
                                        >
                                            Apply Preview
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