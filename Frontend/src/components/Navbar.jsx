import React, { useState } from "react";
import darkLogo from "../assets/images/darkLogo.png";
import lightLogo from "../assets/images/lightLogo.png";
import { IoSearch } from "react-icons/io5";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import { HiOutlineMenuAlt3, HiX } from "react-icons/hi";
import Snowfall from "react-snowfall";
import { useTheme } from "../contexts/ThemeContext";
import CustomConnectButton from "./CustomConnectButton";

function Navbar() {

  const { isDarkMode, toggleDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="dark:bg-[#0f121e] bg-[#161c32] px-4 md:px-6 py-3 flex items-center justify-between shadow-md border-b border-white/20 relative">

      <Snowfall snowflakeCount={35} />


      <div className="w-28 sm:w-32 md:w-44">
        <img
          src={isDarkMode ? darkLogo : lightLogo}
          alt="NeuroGuild Logo"
          className="object-contain"
        />
      </div>


      <div className="hidden md:flex items-center gap-6 w-[80%] justify-end">

        <div className="flex items-center border-[#31c4c1] flex-1 max-w-md bg-transparent border-2 dark:border-blue-500 rounded-lg px-4 py-2 text-white focus-within:shadow-[0_0_10px_2px_#31c4c1] dark:focus-within:shadow-[0_0_10px_2px_rgba(59,130,246,0.7)] transition-all duration-300">
          <IoSearch className="dark:text-blue-400 text-[#1be4e0] text-lg mr-2" />
          <input
            type="text"
            placeholder="Find Ai-Automated Gigs.."
            className="bg-transparent flex-1 outline-none text-sm md:text-base text-white placeholder-gray-400"
          />
        </div>

        {/* Connect Button */}

        <CustomConnectButton />


        <button
          onClick={toggleDark}
          className="text-white hover:shadow-[#1be4e0] dark:hover:shadow-blue-700 hover:bg-[#0e1525] px-3 rounded-lg py-2 text-2xl hover:shadow-lg hover:text-[#1be4e0] dark:hover:text-blue-400 transition-colors duration-300"
        >
          {isDarkMode ? <MdOutlineLightMode /> : <MdOutlineDarkMode />}
        </button>
      </div>

      <button
        className="md:hidden text-white text-3xl p-2 rounded-lg hover:bg-white/10"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <HiX /> : <HiOutlineMenuAlt3 />}
      </button>


      {menuOpen && (
        <div  className="absolute border-b border-white/20 top-full left-0 w-full dark:bg-[#0f121e] bg-[#161c32] border-t  shadow-lg flex flex-col items-start p-4 gap-4 md:hidden z-50">

          <div className="flex border-b  items-center border-[#31c4c1] w-full bg-transparent border-2 dark:border-blue-500 rounded-lg px-4 py-2 text-white">
            <IoSearch className="dark:text-blue-400 text-[#1be4e0] text-lg mr-2" />
            <input
              type="text"
              placeholder="Find Ai-Automated Gigs.."
              className="bg-transparent flex-1 outline-none text-sm text-white placeholder-gray-400"
            />
          </div>

          <CustomConnectButton />


          <button
            onClick={toggleDark}
            className="text-white  flex items-center gap-2 text-lg"
          >
            {isDarkMode ? (
              <>
                <MdOutlineLightMode /> Light Mode
              </>
            ) : (
              <>
                <MdOutlineDarkMode /> Dark Mode
              </>
            )}
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
