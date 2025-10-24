import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdSecurity } from "react-icons/md";
import { RiExchangeDollarLine } from "react-icons/ri";
import { BsPeople } from "react-icons/bs";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import Snowfall from "react-snowfall";
import axios from "axios";
import "../index.css";
import { useParams } from "react-router-dom";
import { skillsData } from "../utils/skillData";
import skillTokenizable from "../utils/tokenizableSkills";
import { mintSbt } from "../utils/mint_sbt";
import { BrowserProvider } from 'ethers'

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
    const { data: walletClient } = useWalletClient();
    const [isAlreadyMint, setIsAlreadyMint] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    async function getSigner(params) {
        let signer;
        if (walletClient) {
            const provider = new BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
        }
        return signer;
    }

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
        if (!address) return;

        async function checkAlreadyMint() {
            try {
                const res = await axios.post('http://localhost:5000/is-already-mint', {
                    address,
                });

                if (res.data.isMintedSuccess) {
                    setIsAlreadyMint(true)
                    console.log(res.data.isMintSuccess)
                }
            } catch (error) {
                console.log(error);
            }
        }

        async function checkUserExists() {
            try {
                const res = await axios.get('http://localhost:5000/check-user-passed', {
                    params: { skill, address },
                });

                if (!res.data.isPassed) {
                    setRedNotice(true);
                    setNotice("First pass the Quiz");
                    setTimeout(() => {
                        navigate('/');
                    }, 2000);
                }

            } catch (error) {
                console.log(error);
            }
        }

        checkAlreadyMint();
        checkUserExists();

    }, [isConnected, address]);



    useEffect(() => {
        if (!notice) return;
        const id = setTimeout(() => setNotice(null), 3500);
        return () => clearTimeout(id);
    }, [notice]);

    async function handleSbtMint() {
        const signer = await getSigner();
        if (!signer) {
            setRedNotice(true);
            setNotice("Please connect your wallet first.");
            return;
        }
        setIsProcessing(true)
        try {

            const cid = skillsData[skill]?.badge;
            if (!cid) {
                setRedNotice(true);
                setNotice("Invalid skill data — please try again.");
                return;
            }

            if (!isAlreadyMint) {
                const isMintSuccess = await mintSbt(signer);
                if (!isMintSuccess) {
                    setRedNotice(true);
                    setNotice("Mint not successful or rejected. Try again.");
                    return;
                }

            }

            const res = await axios.put('http://localhost:5000/upgrade-skill', {
                address,
                skill,
                cid
            });

            if (res.status === 200) {
                setRedNotice(false);
                setNotice(" Congratulations! SBT mint successful.");
            }

        } catch (error) {
            console.error("Mint/Upgrade failed:", error);
            setRedNotice(true);
            setNotice("Something went wrong. Please try again.");
        } finally {
            setIsProcessing(false)
        }
    }






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
                            <button
                                onClick={handleSbtMint}
                                disabled={isProcessing} // disable button while processing
                                className={`px-8 w-full py-4 rounded-xl text-white font-bold tracking-widest transition-all duration-300 transform
                ${isProcessing
                                        ? "bg-gray-400 cursor-not-allowed shadow-none"
                                        : "bg-gradient-to-r from-[#1be4e0] to-blue-500 shadow-[0_0_25px_rgba(27,228,224,0.5)] hover:shadow-[0_0_40px_rgba(27,228,224,0.8)] hover:scale-105"
                                    }`}
                            >
                                {isProcessing ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                        </svg>
                                        <span>Processing...</span>
                                    </div>
                                ) : (
                                    isAlreadyMint ? "Upgrade Skill" : "Mint SBT"
                                )}
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