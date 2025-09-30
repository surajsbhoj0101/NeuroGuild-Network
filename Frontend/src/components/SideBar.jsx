import React from "react";
import { Link } from "react-router-dom";
import { MdSpaceDashboard } from "react-icons/md";
import { BsBriefcase } from "react-icons/bs";
import { FaRegUser } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";

function SideBar() {
  const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
  const robotoStyle = { fontFamily: 'Roboto, sans-serif' };
  const menuItems = [
    { name: "Dashboard", icon: <MdSpaceDashboard />, link: "#" },
    { name: "Browse Jobs", icon: <BsBriefcase />, link: "#" },
    { name: "My Profile", icon: <FaRegUser />, link: "#" },
    { name: "Settings", icon: <IoSettingsOutline />, link: "#" },
  ];

  return (
    <aside className="h-screen sticky top-0  w-fit border-r border-[#262f55] bg-gradient-to-r from-[#191f37] to-[#161c32] flex flex-col dark:border-[#161b2c] dark:bg-none dark:bg-[#0f121e]">
      <ul className="space-y-3">
        {menuItems.map((item, idx) => (
          <li key={idx}>
            <Link
              to={item.link}
              className="flex items-center gap-3 px-6 py-5 text-gray-100 dark:text-gray-200
      hover:border-l-2 hover:border-r-2 focus:border-l-3 focus:border-r-3
      hover:bg-[#1e2642] dark:focus:bg-[#161b2c] focus:bg-[#1d243f] dark:hover:border-blue-500 dark:focus:border-blue-500 focus:border-[#31c4c1]
      hover:text-[#31c4c1] dark:hover:text-blue-400 focus:text-[#31c4c1] dark:focus:text-blue-400"
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
