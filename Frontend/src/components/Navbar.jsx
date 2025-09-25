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
    <nav className="bg-slate-100 relative z-50">
      <div className="container mx-auto flex justify-between items-center px-6 py-4 rounded-2xl shadow-md bg-white">
        {/* Logo */}
        <div className="w-40">
          <img src={logo} alt="NeuroGuild Logo" className="object-contain" />
        </div>

        {/* Desktop Links + Button */}
        <div className="hidden md:flex items-center space-x-12">
          <ul className="flex space-x-8">
            {links.map((link) => (
              <li key={link}>
                <Link
                  to={`#${link.replace(/\s+/g, "").toLowerCase()}`}
                  className="relative font-medium text-lg text-gray-500 hover:text-blue-500 transition-colors duration-300
                  after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[3px] after:bg-blue-500 after:rounded-full
                  hover:after:w-full after:transition-all after:duration-300"
                >
                  {link}
                </Link>
              </li>
            ))}
          </ul>

          <button
            className="px-6 py-2 rounded-xl bg-blue-500 text-white font-medium shadow-lg hover:bg-blue-600 hover:scale-105 transition-all duration-300"
          >
            Login / Connect
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden p-1 rounded-md cursor-pointer hover:bg-gray-100" onClick={toggleSidebar}>
          <MdMenuOpen size={28} className="text-gray-700 transition-colors duration-300" />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
