import React, { useState } from "react";
import logo from "../assets/images/logo.png";
import { IoSearch } from "react-icons/io5";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import Snowfall from 'react-snowfall';

function Navbar() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <nav className="bg-[#0E1620] px-6 py-3 flex items-center justify-between shadow-md border-b border-white/20">
      <Snowfall
        snowflakeCount={40}
       
      />

      {/* Logo */}
      <div className="w-32 sm:w-36 md:w-52">
        <img src={logo} alt="NeuroGuild Logo" className="object-contain" />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6 w-[60%] justify-end">

        <div className="flex items-center flex-1 max-w-md bg-transparent border-2 border-blue-500 rounded-lg px-5 py-3 text-white focus-within:shadow-[0_0_10px_2px_rgba(59,130,246,0.7)] transition-all duration-300">
          <IoSearch className="text-blue-400 text-lg mr-2" />
          <input
            type="text"
            placeholder="Find Ai-Automated Gigs.."
            className="bg-transparent flex-1 outline-none text-sm md:text-base text-white placeholder-gray-400"
          />
        </div>


        <button className="px-5 py-3 rounded-lg bg-gradient-to-r from-blue-700 to-[#0E1220] text-white font-medium shadow-blue-700 hover:shadow-[0_0_12px_rgba(168,85,247,0.8)] transition-all duration-300">
          Connect / Login
        </button>


        <button
          onClick={() => setDarkMode(!darkMode)}
          className="text-white  hover:shadow-blue-700 hover:bg-[#0e1525] px-4 rounded-lg py-3  text-2xl  hover:shadow-lg hover:text-blue-400 transition-colors duration-300"
        >
          {darkMode ? <MdOutlineLightMode /> : <MdOutlineDarkMode />}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
