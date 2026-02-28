import { useState, useEffect } from 'react'
import SideBar from '../../components/SideBar'
import NoticeToast from "../../components/NoticeToast";
import "../../index.css"
import { useAuth } from "../../contexts/AuthContext.jsx";


function Setting() {
    const [count, setCount] = useState(0)
    const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
    const robotoStyle = { fontFamily: 'Roboto, sans-serif' };
    const { isAuthentication } = useAuth();

    // notice shown when redirecting due to no wallet
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        let t;
        if (!isAuthentication) {
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
    }, [isAuthentication]);

    return (
        <>
            <NoticeToast
                message={notice}
                onClose={() => setNotice(null)}
            />

            {/* make container relative and hide horizontal overflow to prevent extra width */}
            <div className='dark:bg-[#0f111d] pt-6 flex bg-[#161c32] w-full'>
                {/* decorative background blobs */}
                <div className="pointer-events-none absolute right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
                <div className="pointer-events-none absolute left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>

                <SideBar /></div>
        </>
    )
}

export default Setting
