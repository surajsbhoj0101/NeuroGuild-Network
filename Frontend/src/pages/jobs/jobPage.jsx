import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import axios from "axios";
import { useParams } from 'react-router-dom';
import MatchScore from '../../components/MatchScore';
import { ScrollText, Star, Clock, Award, Plus, X, Check, User, Mail, MapPin, Github, Linkedin, Twitter, Globe } from 'lucide-react';


function jobPage() {
    const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
    const robotoStyle = { fontFamily: 'Roboto, sans-serif' };
    const [jobDetails, setJobDetails] = useState(null)

    const { jobId } = useParams();

    const fetchJob = async (params) => {
        try {
            const job = await axios.get(`http://localhost:5000/api/jobs/fetch-job/${jobId}`);
            setJobDetails(job.data.jobDetails);
        } catch (error) {
            console.log("Unable to find job details", error);
            setRedNotice(true)
            setNotice("Unable to fetch the job details");
            setTimeout(() => {
                navigate('/')
            }, 4000);
        }
    }

    useEffect(() => {
        fetchJob()
    }, [jobId])


    const { isConnected, address } = useAccount();
    const navigate = useNavigate();

    const [notice, setNotice] = useState(null);
    const [redNotice, setRedNotice] = useState(false);
    return (
        <>
            <div className='dark:bg-[#0f111d]  flex bg-[#161c32] w-full'>
                {/* floating notice */}
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


                <div className="pointer-events-none fixed right-[5%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
                {/* <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div> */}

                <div className="flex min-h-screen gap-3 p-8 w-full">


                    <div className=" w-[60%] space-y-6">

                        <div className='border p-4 rounded-xl border-[#14a19f]/10'>
                            <h1
                                style={orbitronStyle}
                                className="text-3xl font-semibold text-white"
                            >
                                {jobDetails?.title}
                            </h1>


                            <div className="flex gap-4 p-2  text-gray-300 text-sm">
                                <span className="bg-[#1b233d] px-3 py-1 rounded">Intermediate</span>


                                <span className="flex items-center gap-1">
                                    <Clock size={16} /> {jobDetails?.createdAt?.slice(0, 10)}
                                </span>

                                <span className="flex items-center gap-1 text-red-300">
                                    <Clock size={16} /> {jobDetails?.deadline?.slice(0, 10)}
                                </span>

                            </div>
                        </div>


                        <div className="backdrop-blur-md border border-[#14a19f]/10 shadow-2xl p-5 rounded-xl text-gray-200 leading-relaxed">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><ScrollText size={24} className="text-[#14a19f] dark:text-white"/> Job Description</h2>
                            <p className='text-gray-200 py-2 leading-relaxed whitespace-pre-wrap'>
                                {jobDetails?.description}
                            </p>
                        </div>

                        <div className="backdrop-blur-md border border-[#14a19f]/10  shadow-2xl p-5 rounded-xl text-gray-200">
                            <h2 className="text-xl font-semibold text-white mb-3">Required Skills</h2>
                            <div className="flex gap-2 flex-wrap">
                                {jobDetails?.skills.map((skill, idx) => (
                                    <span key={idx} className="bg-[#1be4e0]/50 
                                    dark:bg-[#0a184b] 
                                   
                                    px-3 py-1 rounded-xl font-semibold text-sm">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="backdrop-blur-md border border-[#14a19f]/10 shadow-2xl p-5 rounded-xl text-gray-200">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Award size={20} className="text-[#14a19f] dark:text-[white]" />
                                Budget
                            </h2>

                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-[#14a19f] dark:text-white">${jobDetails?.budget}</span>
                                <span className="text-gray-400">USD</span>
                            </div>
                        </div>

                    </div>

                    <div className="hidden lg:flex  flex-col w-[40%] items-center">
                        <div className="sticky w-4/5 top-3 flex flex-col justify-center space-y-3">


                            <div className="flex flex-col items-center rounded-xl border border-[#14a19f]/10 px-6 py-4 space-y-6">
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

                            <div className="border p-3 border-[#14a19f]/10 rounded-xl">
                                <h3 className="text-lg font-semibold text-white mb-4">About the Client</h3>

                                <div className="flex items-center gap-4 mb-4">

                                    <img
                                        src={jobDetails?.clientDetails?.companyDetails?.logoUrl ||
                                            `https://api.dicebear.com/7.x/bottts/svg?seed=${jobDetails?.clientAddress}`}
                                        alt="Client Logo"
                                        className="w-16 h-16 rounded-full border border-[#14a19f]/30 object-cover"
                                    />

                                    <div className="flex flex-col gap-2 text-sm">
                                        <span className="font-semibold text-lg text-gray-100">{jobDetails?.clientDetails?.companyDetails?.companyName}</span>

                                        <div className="flex items-center gap-2 text-gray-300">
                                            <span className="text-yellow-400">
                                                <Star size={18} fill="currentColor" />
                                            </span>
                                            <span className="text-sm font-medium text-white">{jobDetails?.clientDetails?.stats?.averageRating}/5 Average Rating</span>
                                        </div>


                                    </div>
                                </div>


                                <button className="w-full bg-transparent text-[#14a19f] dark:text-white border border-[#14a19f] dark:border-[#0a184b] font-semibold py-2 rounded-lg hover:bg-[#14a19f]/10 dark:hover:bg-[#0d1c4e] transition-colors">
                                    View Profile
                                </button>
                            </div>
                        </div>
                    </div>




                </div>
            </div >



        </>
    )
}

export default jobPage