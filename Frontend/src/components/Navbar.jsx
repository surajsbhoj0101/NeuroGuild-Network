import React, { useState } from "react";
import logo from "../assets/images/logo.png";
import { Link } from "react-router-dom";
import { MdMenuOpen, MdClose } from "react-icons/md";

function Navbar() {
  const [isSidebar, setSidebar] = useState(false);

  const toggleSidebar = () => setSidebar((prev) => !prev);
  const closeSidebar = () => setSidebar(false);

  const links = ["Home", "Find Work", "Find Freelancers", "Contact"];

  return (
    <nav className="bg-slate-100 px-4 sm:px-8 lg:px-24 py-4 z-50">
      <div className="container mx-auto flex justify-between items-center shadow-md px-4 sm:px-6 lg:px-10 py-4 rounded-2xl bg-white">
        {/* Logo */}
        <div className="w-32 sm:w-36 md:w-40">
          <img src={logo} alt="NeuroGuild Logo" className="object-contain" />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-12">
          {links.map((link) => (
            <Link
              key={link}
              to={`#${link.replace(/\s+/g, "").toLowerCase()}`}
              className="relative font-medium text-base lg:text-lg text-gray-500 hover:text-blue-500 transition-colors duration-300
                after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[3px] after:bg-blue-500 after:rounded-full
                hover:after:w-full after:transition-all after:duration-300"
            >
              {link}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* Login button visible from >=480px */}
          <button className="px-3 sm:px-4 py-2 hidden min-[480px]:flex rounded-xl bg-blue-500 text-white font-medium shadow-lg hover:bg-blue-600 hover:scale-105 transition-all duration-300 text-sm sm:text-base">
            Login / Connect
          </button>

          {/* Mobile Toggle */}
          <div
            className="md:hidden p-1 rounded-md cursor-pointer hover:bg-gray-100"
            onClick={toggleSidebar}
          >
            <MdMenuOpen size={28} className="text-gray-700" />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-0 z-50 bg-slate-100 opacity-95 transform transition-transform duration-300 ${
          isSidebar ? "translate-x-0" : "translate-x-full"
        } md:hidden`}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={closeSidebar}
            aria-label="Close Menu"
            className="p-2 rounded-md hover:bg-gray-200"
          >
            <MdClose className="text-3xl text-gray-700" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex flex-col items-center space-y-6 h-[calc(100vh-80px)] text-2xl font-semibold text-gray-700">
          <button className="px-4 py-2 rounded-xl bg-blue-500 text-white font-medium shadow-lg hover:bg-blue-600 transition-all duration-300">
            Login / Connect
          </button>

          {links.map((link) => (
            <Link
              key={link}
              to={`#${link.replace(/\s+/g, "").toLowerCase()}`}
              onClick={closeSidebar}
              className="relative font-medium text-lg text-gray-500 hover:text-blue-500 transition-colors duration-300"
            >
              {link}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
