import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import SideBar from '../components/SideBar';

import "../index.css";
const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

export default function MyProfile() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let t;
    if (!isConnected) {
      setNotice("Wallet not connected — redirecting to home...");
      t = setTimeout(() => navigate('/'), 1600);
    } else {
      setNotice(null);
    }
    return () => clearTimeout(t);
  }, [isConnected, navigate]);

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

      <div className='dark:bg-[#0f111d] pt-6 flex bg-[#161c32] w-full min-h-screen'>
        <div className="hidden md:block">
          <SideBar />
        </div>

        <div className='flex w-full px-3 gap-4'>
          <div>
            <div>
              <p style={orbitronStyle} className='text-white text-3xl tracking-widest font-extrabold mb-1'>My Profile</p>
            </div>
          </div>
          <div></div>
        </div>
      </div>
    </>
  );
}