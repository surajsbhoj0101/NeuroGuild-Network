import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import SideBar from '../../components/SideBar';
import axios from "axios";


function PostJobs() {
    const { isConnected, address } = useAccount();
    const navigate = useNavigate();
    const [notice, setNotice] = useState(null);
    const [redNotice, setRedNotice] = useState(false);

    useEffect(() => {
        let t;
        if (!isConnected) {
            setRedNotice(true);
            setNotice("Wallet not connected — redirecting to home...");
            t = setTimeout(() => navigate('/'), 1600);
        } else if (address) {
            setNotice(null);
            
        }
        //Note:
        /*
          User opens the page → isConnected = false → setTimeout starts.
    
          Before 1.6s, user connects wallet → isConnected = true.
    
          Effect runs again:
    
            Cleanup triggers → clearTimeout(t) cancels the old redirect.
    
            loadProfileData() runs instead.
    
          This ensures only the latest intended behavior happens.
        */
        return () => clearTimeout(t);
    }, [isConnected, navigate, address]);

    return (
        <div className="min-h-screen relative overflow-hidden dark:bg-[#0f111d] bg-[#0f1422] text-white">
           
            {/* decorative background blobs */}
            <div className="pointer-events-none absolute -left-32 -top-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#122033] via-[#0f2540] to-[#08101a] opacity-40 blur-3xl mix-blend-screen"></div>
            <div className="pointer-events-none absolute right-[-120px] top-48 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
            <div className="hidden md:block">
                <SideBar />
            </div>
            {/* notice */}
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


        </div>
    )
}

export default PostJobs