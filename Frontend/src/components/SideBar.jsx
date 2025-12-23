import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdSpaceDashboard } from "react-icons/md";
import { BsBriefcase } from "react-icons/bs";
import { FaRegUser } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { useAccount } from "wagmi";
import axios from "axios";

function SideBar() {
  const [activeIndex, setActiveIndex] = useState(0);
  const location = useLocation();
  const { isConnected, address } = useAccount();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!isConnected || !address || role) return;

    const getUser = async () => {
      try {
        const res = axios
          .get("http://localhost:5000/api/auth/check-jwt", {
            withCredentials: true,
          })
          .then((res) => {
            if (!res.data.isFound) {
              navigate("/");
              return;
            }
            setRole(res.data.role);
          })
          .catch(() => navigate("/"));
      } catch (error) {
        console.error("Error fetching or creating user:", error);
      }
    };

    getUser();
  }, [isConnected, address, role]);

  const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
  const robotoStyle = { fontFamily: "Roboto, sans-serif" };

  const clientMenu = [
    {
      name: "Dashboard",
      icon: <MdSpaceDashboard />,
      link: "/client/dashboard",
    },
    { name: "Post Jobs", icon: <BsBriefcase />, link: "/post-job" },
    { name: "My Profile", icon: <FaRegUser />, link: "/client/my-profile" },
    { name: "Settings", icon: <IoSettingsOutline />, link: "/client/settings" },
  ];

  const freelancerMenu = [
    {
      name: "Dashboard",
      icon: <MdSpaceDashboard />,
      link: "/freelancer/dashboard",
    },
    { name: "Browse Jobs", icon: <BsBriefcase />, link: "/browse-jobs" },
    { name: "My Profile", icon: <FaRegUser />, link: "/freelancer/my-profile" },
    {
      name: "Settings",
      icon: <IoSettingsOutline />,
      link: "/freelancer/settings",
    },
  ];

  const menuItems = role === "freelancer" ? freelancerMenu : clientMenu;

  useEffect(() => {
    const idx = menuItems.findIndex((item) => {
      if (!item.link || item.link === "#") return false;
      return (
        location.pathname === item.link ||
        location.pathname.startsWith(item.link)
      );
    });
    if (idx !== -1 && idx !== activeIndex) setActiveIndex(idx);
  }, [location.pathname, menuItems]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside className="h-screen  sticky top-0 w-fit border-r border-t rounded-tr-md  border-[#262f55]  backdrop-blur-sm flex flex-col dark:border-[#161b2c] dark:bg-none ">
      <ul className="space-y-3">
        {menuItems.map((item, idx) => (
          <li key={idx}>
            <Link
              to={item.link}
              onClick={() => setActiveIndex(idx)}
              aria-current={activeIndex === idx ? "true" : undefined}
              className={`flex items-center gap-3 px-6 py-5 text-gray-100 dark:text-gray-200
      hover:border-l-2 hover:border-r-2 focus:border-l-3 focus:border-r-3
      hover:bg-[#1e2642] dark:focus:bg-[#161b2c] focus:bg-[#1d243f] dark:hover:border-blue-500 dark:focus:border-blue-500 focus:border-[#31c4c1]
      hover:text-[#31c4c1] dark:hover:text-blue-400 focus:text-[#31c4c1] dark:focus:text-blue-400
      ${
        activeIndex === idx
          ? "bg-[#1d243f] border-l-2 border-[#31c4c1] text-[#31c4c1]"
          : ""
      }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span
                style={orbitronStyle}
                className="text-base tracking-widest font-medium whitespace-nowrap"
              >
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
