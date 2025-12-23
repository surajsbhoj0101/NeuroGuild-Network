import React, { useState } from "react";
import darkLogo from "../assets/images/darkLogo.png";
import lightLogo from "../assets/images/lightLogo.png";
import { IoSearch } from "react-icons/io5";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import { HiOutlineMenuAlt3, HiX } from "react-icons/hi";
import Snowfall from "react-snowfall";
import { useTheme } from "../contexts/ThemeContext";
import CustomConnectButton from "./CustomConnectButton";
import { Link } from "react-router-dom";
import logo from "../assets/images/logo.png";

function Navbar() {
  const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
  const robotoStyle = { fontFamily: 'Roboto, sans-serif' };
  const { isDarkMode, toggleDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="relative z-40">
      <div className="dark:bg-[#0f121e] bg-[#161c32] px-4 md:px-6 py-3 shadow-md border-b border-white/8 backdrop-blur-sm">
        <Snowfall snowflakeCount={18} />

        <div className="max-w-6xl mx-auto flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center no-underline">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg   flex items-center justify-center shadow-inner  ring-white/6">
                <img
                  src={logo}
                  alt="NeuroGuild"
                  className="w-11 h-11 md:w-12 md:h-12 object-contain"
                />
              </div>

              <div className="leading-tight">
                <div style={orbitronStyle} className="text-white text-lg md:text-xl tracking-wider select-none">NeuroGuild</div>
                <div style={robotoStyle} className="text-[11px] md:text-[12px] text-gray-400 -mt-0.5">Decentralized Freelancing</div>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 items-center justify-center px-6">
            <div className="w-full max-w-2xl">
              <div className="flex items-center bg-[#0c1422]/60 dark:bg-[#07101a]/60 border border-[#2a3847] rounded-2xl px-3 py-2 hover:shadow-[0_6px_24px_rgba(20,161,159,0.06)] transition">
                <div className="text-[#1be4e0] dark:text-blue-400 text-xl p-1">
                  <IoSearch />
                </div>
                <input
                  type="text"
                  placeholder="Find AI-powered gigs, skills or freelancers..."
                  style={robotoStyle}
                  className="bg-transparent flex-1 outline-none text-sm md:text-base text-gray-100 placeholder-gray-400 px-3"
                />
                <button className="ml-2 px-3 py-1.5 bg-gradient-to-r from-[#14a19f] to-[#0fb6b3] hover:opacity-95 rounded-lg text-sm font-medium text-white shadow-sm">
                  Search
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <CustomConnectButton className="!px-3 !py-1.5" />

              <button
                onClick={toggleDark}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/3 hover:bg-white/5 transition text-white"
                aria-label="toggle theme"
              >
                {isDarkMode ? <MdOutlineLightMode className="text-yellow-300 text-lg" /> : <MdOutlineDarkMode className="text-blue-300 text-lg" />}
                <span className="text-xs hidden sm:inline" style={robotoStyle}>{isDarkMode ? 'Light' : 'Dark'}</span>
              </button>
            </div>

            <button
              className="md:hidden text-white text-2xl p-2 rounded-lg hover:bg-white/6 transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="menu"
            >
              {menuOpen ? <HiX /> : <HiOutlineMenuAlt3 />}
            </button>
          </div>
        </div>
      </div>

      {/* mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-4 top-[72px] bg-[#0b1724]/95 backdrop-blur-sm border border-white/6 rounded-xl p-4 shadow-2xl z-50">
          <div className="flex flex-col gap-3">
            <div className="flex items-center border border-[#1f3240] rounded-lg px-3 py-2">
              <IoSearch className="text-[#1be4e0] text-xl mr-2" />
              <input
                type="text"
                placeholder="Find AI-powered gigs..."
                className="bg-transparent flex-1 outline-none text-sm text-white placeholder-gray-400"
              />
              <button className="ml-2 px-3 py-1.5 bg-[#14a19f] rounded-lg text-sm text-white">Search</button>
            </div>

            <div className="flex flex-col gap-2">
              <CustomConnectButton fullWidth />
              <button
                onClick={toggleDark}
                className="w-full text-left px-4 py-2 bg-transparent rounded-lg hover:bg-white/4 flex items-center gap-3"
              >
                {isDarkMode ? <MdOutlineLightMode /> : <MdOutlineDarkMode />} <span style={robotoStyle}>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
