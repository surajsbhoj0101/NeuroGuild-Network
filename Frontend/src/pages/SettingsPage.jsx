import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cog, Clock3 } from "lucide-react";
import SideBar from "../components/SideBar.jsx";
import NoticeToast from "../components/NoticeToast.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
const robotoStyle = { fontFamily: "Roboto, sans-serif" };

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isAuthentication } = useAuth();
  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);

  useEffect(() => {
    let timer;
    if (!isAuthentication) {
      setRedNotice(true);
      setNotice("Wallet not connected — redirecting to home...");
      timer = setTimeout(() => navigate("/"), 1400);
    }
    return () => clearTimeout(timer);
  }, [isAuthentication, navigate]);

  return (
    <>
      <NoticeToast message={notice} isError={redNotice} onClose={() => setNotice(null)} />

      <div className="dark:bg-[#0f111d] py-4 md:py-8 flex flex-col md:flex-row gap-4 bg-[#161c32] w-full min-h-screen overflow-x-clip">
        <div className="pointer-events-none fixed right-[1%] bottom-[20%] h-[420px] w-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
        <div className="pointer-events-none fixed left-[5%] bottom-[1%] h-[420px] w-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />

        <div className="hidden md:block">
          <SideBar />
        </div>

        <div className="relative z-10 flex min-w-0 flex-1 items-center justify-center px-4 pb-8 md:px-8">
          <div className="w-full max-w-2xl rounded-[28px] border border-[#14a19f]/20 bg-[#0d1224]/58 p-8 text-center backdrop-blur-md">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#14a19f]/25 bg-[#14a19f]/10 text-[#8ff6f3]">
              <Cog size={28} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-white md:text-3xl" style={orbitronStyle}>
              Settings
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-400 md:text-base" style={robotoStyle}>
              This section will be added in future.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-300">
              <Clock3 size={15} />
              Coming later
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
