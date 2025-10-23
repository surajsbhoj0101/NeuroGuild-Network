import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdSecurity } from "react-icons/md";
import { RiExchangeDollarLine } from "react-icons/ri";
import { BsPeople } from "react-icons/bs";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Snowfall from "react-snowfall";
import axios from "axios";
import "../index.css";
import { useParams } from "react-router-dom";
import { skillsData } from "../utils/skillData";
import skillTokenizable from "../utils/tokenizableSkills";


const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
const robotoStyle = { fontFamily: "Roboto, sans-serif" };

function SbtMint() {
    const { address, isConnected } = useAccount();
    const navigate = useNavigate();
    const [notice, setNotice] = useState(null);
    const { skill } = useParams();
    const [redNotice, setRedNotice] = useState(false);
    const [isPassed, setIsPassed] = useState(false);
    const [logo, setLogo] = useState(null);

    useEffect(() => {
        if (!skillTokenizable.includes(skill)) {
            setRedNotice(true);
            setNotice("This Skill is not tokenizable")
            setTimeout(() => {
                navigate('/');
            }, 3000);
        }
        else {
            const cid = skillsData[skill].badge.replace("ipfs://", "https://ipfs.io/ipfs/");
            setLogo(cid)
        }
    }, [])

    useEffect(() => {


        async function checkUserExists() {
            try {
                const res = await axios.get('http://localhost:5000/check-user-passed', {
                    params: { skill, address },

                });
                if (!res.data.isPassed) {
                    setRedNotice(true);
                    setNotice("First pass the Quiz")
                    setTimeout(() => {
                        navigate('/')

                    }, 2000);
                }


            } catch (error) {
                console.log(error);

            }
        }
        if (address) {
            checkUserExists();
        }



    }, [isConnected, address]);


    useEffect(() => {
        if (!notice) return;
        const id = setTimeout(() => setNotice(null), 3500);
        return () => clearTimeout(id);
    }, [notice]);



    return (
        <div className="min-h-screen relative overflow-hidden dark:bg-[#0f111d] bg-[#0f1422] text-white">
            <Snowfall snowflakeCount={60} />
            {/* decorative background blobs */}
            <div className="pointer-events-none absolute -left-32 -top-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#122033] via-[#0f2540] to-[#08101a] opacity-40 blur-3xl mix-blend-screen"></div>
            <div className="pointer-events-none absolute right-[-120px] top-48 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>


            {/* Notice */}
            {notice && (
                <div className="fixed top-4 right-4 z-50 animate-pulse">
                    <div
                        className={`flex items-center gap-3 text-white px-4 py-2 rounded shadow-lg border ${redNotice
                            ? "bg-red-600 border-red-700"
                            : "bg-[#14a19f] border-[#1ecac7]/30"
                            }`}
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

            <section className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row justify-center space-x-10 items-center gap-10 relative z-10">
                {/* Left Side — Text */}
                <div className="flex flex-col gap-8 text-left lg:w-1/2">
                    <div className="flex flex-col gap-6">
                        <h1
                            style={orbitronStyle}
                            className="text-4xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-[#1be4e0] to-blue-500 bg-clip-text text-transparent"
                        >
                            You’ve Earned It — Now Prove It.
                        </h1>

                        <p
                            style={orbitronStyle}
                            className="text-xl md:text-3xl font-semibold text-gray-200 leading-relaxed max-w-xl"
                        >
                            Mint your verified <span className="text-[#1be4e0]">Skill SBT</span> and
                            showcase your expertise in the{" "}
                            <span className="text-blue-400">NeuroGuild</span> ecosystem.
                        </p>
                    </div>

                    <div className="pt-2 w-md flex justify-center items-center">
                        {isConnected ? (
                            <button className="px-8 w-full py-4 rounded-xl bg-gradient-to-r from-[#1be4e0] to-blue-500 text-white font-bold tracking-widest shadow-[0_0_25px_rgba(27,228,224,0.5)] hover:shadow-[0_0_40px_rgba(27,228,224,0.8)] transition-all duration-300 transform hover:scale-105">
                                Mint SBT
                            </button>
                        ) : (
                            <ConnectButton />
                        )}
                    </div>
                </div>


                <div className="w-86 h-98 rounded-xl bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 p-2 hover:scale-105 transition-transform duration-300">
                    <img
                        src={logo}
                        alt="SBT Logo"
                        className="rounded-lg w-full h-full object-cover shadow-md"
                    />
                </div>

            </section>

        </div>


    )
}

export default SbtMint