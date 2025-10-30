import { useState, useEffect } from 'react'
import SideBar from '../../components/SideBar'
import { useAccount } from "wagmi";
import "../../index.css"

import MyJobsTabs from '../../components/MyJobTabs'
import AiPoweredJobMatches from '../../components/AiPoweredJobMatches'
function Dashboard() {
    const [count, setCount] = useState(0)
    const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
    const robotoStyle = { fontFamily: 'Roboto, sans-serif' };
    const { isConnected } = useAccount();
    
  
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        let t;
        if (!isConnected) {
            // show user-friendly message, then redirect after short delay
            setNotice("Wallet not connected — redirecting to home...");
            t = setTimeout(() => {
                // perform navigation after showing notice
                window.location.href = "/";
            }, 1800);
        } else {
            setNotice(null);
        }
        return () => clearTimeout(t);
    }, [isConnected]);

    return (
        <>
            {/* floating notice */}
            {notice && (
                <div className="fixed top-4 right-4 z-50">
                    <div className="flex items-center gap-3 bg-[#14a19f] text-white px-4 py-2 rounded shadow-lg">
                        <div className="text-sm">{notice}</div>
                        <button
                            onClick={() => setNotice(null)}
                            className="ml-2 text-xs text-white/90 px-2 py-1 rounded hover:opacity-90"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* make container relative and hide horizontal overflow to prevent extra width */}
            <div className='dark:bg-[#0f111d] pt-6 flex bg-[#161c32] w-full'>
                {/* decorative background blobs */}
                <div className="pointer-events-none absolute right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
                <div className="pointer-events-none absolute left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>

                <SideBar />

                <div className='flex w-full'>
                    {/* AI-powered job matches section */}
                    <AiPoweredJobMatches />

                    {/* Center the MyJobsTabs component */}
                    <div className='flex justify-center w-full'>
                        <MyJobsTabs />
                    </div>
                </div>
            </div>


        </>
    )
}

export default Dashboard;