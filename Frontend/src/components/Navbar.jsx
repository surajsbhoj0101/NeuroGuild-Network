import React, { useEffect, useState } from "react";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import { HiOutlineMenuAlt3, HiX } from "react-icons/hi";
import { Bell, CircleDollarSign, MessageCircle, Shield, Sparkles } from "lucide-react";
import Snowfall from "react-snowfall";
import { useTheme } from "../contexts/ThemeContext";
import { useNotifications } from "../contexts/NotificationContext";
import CustomConnectButton from "./CustomConnectButton";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo.png";
import { useAccount } from "wagmi";
import { emptyTokenBalances, getTokenBalances } from "../utils/getTokenBalances";

function Navbar() {
  const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
  const robotoStyle = { fontFamily: 'Roboto, sans-serif' };
  const { isDarkMode, toggleDark } = useTheme();
  const { address, isConnected } = useAccount();
  const {
    notificationItems,
    appNotificationItems,
    totalNotificationCount,
    markConversationRead,
    markAppNotificationRead,
    markAllAppNotificationsRead,
  } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [balances, setBalances] = useState(emptyTokenBalances);

  const formatRelative = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMinutes < 1) return "now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const openNotificationTarget = async (item) => {
    if (item?._id) {
      await markConversationRead(item._id);
    }
    setNotificationOpen(false);
    if (item?.participantId) {
      navigate(`/messages/${item.participantId}`);
      return;
    }
    navigate("/messages");
  };

  const openAppNotificationTarget = (item) => {
    if (!item?._id) return;
    markAppNotificationRead(item._id);
    setNotificationOpen(false);
    if (item?.link) {
      navigate(item.link);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchBalances = async () => {
      if (!isConnected || !address) {
        if (!cancelled) {
          setBalances(emptyTokenBalances);
        }
        return;
      }

      const nextBalances = await getTokenBalances(address);
      if (!cancelled) {
        setBalances(nextBalances);
      }
    };

    fetchBalances();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  const balanceItems = [
    {
      label: "USD",
      value: balances.usdc,
      icon: CircleDollarSign,
      accent: "text-emerald-300",
      iconBg: "bg-emerald-400/15",
    },
    {
      label: "Governance",
      value: balances.governance,
      icon: Shield,
      accent: "text-cyan-300",
      iconBg: "bg-cyan-400/15",
    },
  ];

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

          <div className="flex items-center gap-3">
            <div className="hidden z-10 md:flex items-center gap-3">
              <div className="flex items-center gap-2">
                {balanceItems.map(({ label, value, icon: Icon, accent, iconBg }) => (
                  <div
                    key={label}
                    className="min-w-[120px] rounded-xl border border-[#2a3847] bg-[#0c1422]/70 px-3 py-2 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                        <Icon className={`h-4 w-4 ${accent}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400">
                          {label}
                        </p>
                        <p style={orbitronStyle} className="truncate text-sm text-white">
                          {value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative">
                <button
                  onClick={() => setNotificationOpen((prev) => !prev)}
                  className="relative flex items-center justify-center h-10 w-10 rounded-lg bg-white/3 hover:bg-white/5 transition text-white"
                  aria-label="Open notifications"
                >
                  <Bell className="h-5 w-5" />
                  {totalNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#14a19f] text-white text-[11px] leading-5 text-center font-semibold">
                      {totalNotificationCount > 99 ? "99+" : totalNotificationCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[22rem] max-w-[90vw] rounded-xl border border-[#2a3847] bg-[#0d1224]/95 backdrop-blur-sm shadow-2xl">
                    <div className="px-4 py-3 border-b border-[#223041] flex items-center justify-between">
                      <p style={orbitronStyle} className="text-sm text-white tracking-wide">
                        Notifications
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#14a19f]">{totalNotificationCount} unread</span>
                        <button
                          onClick={markAllAppNotificationsRead}
                          className="text-[11px] text-gray-400 hover:text-white transition"
                        >
                          Mark updates read
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notificationItems.length > 0 && (
                        <>
                          <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-gray-500 border-b border-[#1c2736]">
                            Messages
                          </div>
                          {notificationItems.map((item) => (
                            <button
                              key={item._id}
                              onClick={() => openNotificationTarget(item)}
                              className="w-full text-left px-4 py-3 border-b border-[#1c2736] hover:bg-[#141d34] transition"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 h-8 w-8 rounded-full bg-[#14a19f]/20 text-[#14a19f] flex items-center justify-center shrink-0">
                                  <MessageCircle className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm text-white truncate">{item.name}</p>
                                    <span className="text-[11px] text-gray-500 shrink-0">
                                      {formatRelative(item.lastMessageTimestamp)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 truncate">
                                    {item.lastMessage || "New message received"}
                                  </p>
                                </div>
                                <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-[#14a19f] text-white text-[11px] leading-5 text-center">
                                  {item.unread}
                                </span>
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {appNotificationItems.length > 0 && (
                        <>
                          <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-gray-500 border-b border-[#1c2736]">
                            Platform
                          </div>
                          {appNotificationItems.map((item) => (
                            <button
                              key={item._id}
                              onClick={() => openAppNotificationTarget(item)}
                              className="w-full text-left px-4 py-3 border-b border-[#1c2736] hover:bg-[#141d34] transition"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 h-8 w-8 rounded-full bg-blue-500/15 text-blue-300 flex items-center justify-center shrink-0">
                                  <Sparkles className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm text-white truncate">{item.title}</p>
                                    <span className="text-[11px] text-gray-500 shrink-0">
                                      {formatRelative(item.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 truncate">
                                    {item.description || "New platform update"}
                                  </p>
                                </div>
                                {!item.isRead && (
                                  <span className="shrink-0 w-2 h-2 rounded-full bg-blue-300 mt-2" />
                                )}
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {notificationItems.length === 0 && appNotificationItems.length === 0 && (
                        <div className="px-4 py-6 text-sm text-gray-400">
                          No new notifications
                        </div>
                      )}
                    </div>

                    <div className="p-3 border-t border-[#223041]">
                      <button
                        onClick={() => {
                          setNotificationOpen(false);
                          navigate("/messages");
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-[#14a19f]/20 text-[#14a19f] hover:bg-[#14a19f]/30 transition text-sm"
                      >
                        Open Messages
                      </button>
                    </div>
                  </div>
                )}
              </div>

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

      {/* {notificationOpen && (
        <button
          onClick={() => setNotificationOpen(false)}
          className="fixed inset-0 z-30 bg-black/20"
          aria-label="Close notifications panel"
        />
      )} */}

      {/* mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-4 top-[72px] bg-[#0b1724]/95 backdrop-blur-sm border border-white/6 rounded-xl p-4 shadow-2xl z-50">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {balanceItems.map(({ label, value, icon: Icon, accent, iconBg }) => (
                <div
                  key={label}
                  className="rounded-lg border border-[#1f3240] bg-white/4 px-3 py-2"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                      <Icon className={`h-4 w-4 ${accent}`} />
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-gray-400">
                      {label}
                    </span>
                  </div>
                  <div style={orbitronStyle} className="text-sm text-white">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/messages");
                }}
                className="w-full text-left px-4 py-2 bg-transparent rounded-lg hover:bg-white/4 flex items-center justify-between"
              >
                <span style={robotoStyle} className="text-white">Notifications</span>
                {totalNotificationCount > 0 ? (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-[#14a19f] text-white text-[11px] leading-5 text-center">
                    {totalNotificationCount > 99 ? "99+" : totalNotificationCount}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">No new</span>
                )}
              </button>

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
