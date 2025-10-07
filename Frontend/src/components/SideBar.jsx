import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdSpaceDashboard } from "react-icons/md";
import { BsBriefcase } from "react-icons/bs";
import { FaRegUser } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";

function SideBar() {
  const [activeIndex, setActiveIndex] = useState(0);
  const location = useLocation();

  const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
  const robotoStyle = { fontFamily: 'Roboto, sans-serif' };
  const menuItems = [
    { name: "Dashboard", icon: <MdSpaceDashboard />, link: "/Dashboard" },
    { name: "Browse Jobs", icon: <BsBriefcase />, link: "/browse-jobs" },
    { name: "My Profile", icon: <FaRegUser />, link: "/profile" },
    { name: "Settings", icon: <IoSettingsOutline />, link: "/settings" },
  ];

  // Keep active state in sync with the current route so the active item persists
  useEffect(() => {
    const idx = menuItems.findIndex(item => {
      // treat root-like or exact matches; fallback to startsWith for nested routes
      if (!item.link || item.link === "#") return false;
      return location.pathname === item.link || location.pathname.startsWith(item.link);
    });
    if (idx !== -1 && idx !== activeIndex) setActiveIndex(idx);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside className="h-screen sticky top-0 w-fit border-r border-[#262f55] bg-gradient-to-r from-[#191f37] to-[#161c32] flex flex-col dark:border-[#161b2c] dark:bg-none dark:bg-[#0f121e]">
      <ul className="space-y-3">
        {menuItems.map((item, idx) => (
          <li key={idx}>
            <Link
              to={item.link}
              onClick={() => setActiveIndex(idx)}
              aria-current={activeIndex === idx ? 'true' : undefined}
              className={`flex items-center gap-3 px-6 py-5 text-gray-100 dark:text-gray-200
      hover:border-l-2 hover:border-r-2 focus:border-l-3 focus:border-r-3
      hover:bg-[#1e2642] dark:focus:bg-[#161b2c] focus:bg-[#1d243f] dark:hover:border-blue-500 dark:focus:border-blue-500 focus:border-[#31c4c1]
      hover:text-[#31c4c1] dark:hover:text-blue-400 focus:text-[#31c4c1] dark:focus:text-blue-400
      ${activeIndex === idx ? 'bg-[#1d243f] border-l-2 border-[#31c4c1] text-[#31c4c1]' : ''}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span style={orbitronStyle} className="text-base tracking-widest font-medium whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default SideBar;
