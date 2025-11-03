import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import axios from "axios";
import { useParams } from 'react-router-dom';
import MatchScore from '../../components/MatchScore';
import { Clock, Award, Plus, X, Check, User, Mail, MapPin, Github, Linkedin, Twitter, Globe } from 'lucide-react';


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
            <div className='dark:bg-[#0f111d] pt-2 flex bg-[#161c32] w-full'>
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


                <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
                <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>

                <div className="flex min-h-screen gap-3 p-8 w-full">


                    <div className=" w-[60%] space-y-6">
                        <h1
                            style={orbitronStyle}
                            className="text-3xl font-semibold text-white"
                        >
                            {jobDetails?.title}
                        </h1>


                        <div className="flex gap-4 text-gray-300 text-sm">
                            <span className="bg-[#1b233d] px-3 py-1 rounded">Intermediate</span>


                            <span className="flex items-center gap-1">
                                <Clock size={16} /> {jobDetails?.createdAt?.slice(0, 10)}
                            </span>

                            <span className="flex items-center gap-1 text-red-300">
                                <Clock size={16} /> {jobDetails?.deadline?.slice(0, 10)}
                            </span>

                        </div>


                        <div className="backdrop-blur-md shadow-2xl p-5 rounded-lg text-gray-200 leading-relaxed">
                            <h2 className="text-xl font-semibold text-white mb-2">Job Description</h2>
                            <p>
                                {jobDetails?.description}
                            </p>
                        </div>

                        <div className="backdrop-blur-md shadow-2xl p-5 rounded-lg text-gray-200">
                            <h2 className="text-xl font-semibold text-white mb-3">Required Skills</h2>
                            <div className="flex gap-2 flex-wrap">
                                {jobDetails?.skills.map((skill, idx) => (
                                    <span key={idx} className="dark:bg-[#14a19f]/20 bg-[#14a19f]/70 px-3 py-1 rounded text-sm">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="backdrop-blur-md shadow-2xl p-5 rounded-lg text-gray-200">
                            <h2 className="text-xl font-semibold text-white mb-3">Budget</h2>
                            <p>
                                ${jobDetails?.budget}
                            </p>
                        </div>

                    </div>

                    <div className="hidden lg:block w-[40%]">
                        <div className="sticky flex justify-center top-6">
                            <div className="flex flex-col items-center">
                                <h1 className="text-3xl font-semibold text-white mb-4">
                                    Apply for this Gig
                                </h1>

                                <div className="backdrop-blur-md bg-[#161c32]/40 rounded-xl shadow-lg p-6 flex flex-col items-center">
                                    <h2 className="text-lg font-medium text-gray-300 mb-2">
                                        AI Match Score
                                    </h2>

                                    <MatchScore score={82} />
                                </div>
                            </div>
                        </div>
                    </div>



                </div>
            </div>



        </>
    )
}

export default jobPage