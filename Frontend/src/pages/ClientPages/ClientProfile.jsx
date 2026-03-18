import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import SideBar from "../../components/SideBar";
import api from "../../utils/api.js"
import { useAuth } from "../../contexts/AuthContext.jsx";
import NoticeToast from "../../components/NoticeToast";
import { fetchReputationProfile, emptyReputationProfile } from "../../utils/fetch_reputation_profile.js";
import ReputationSbtCard from "../../components/ReputationSbtCard.jsx";
import {
  Plus,
  X,
  Check,
  User,
  Mail,
  MapPin,
  Github,
  Linkedin,
  Twitter,
  Globe,
} from "lucide-react";

function ClientProfile() {
  const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
  const robotoStyle = { fontFamily: "Roboto, sans-serif" };

  const { address } = useAccount();
  const navigate = useNavigate();
  const { isAuthentication } = useAuth();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [reputationProfile, setReputationProfile] = useState(emptyReputationProfile);

  const [profile, setProfile] = useState({
    companyName: "",
    tagline: "",
    logoUrl: "",
    bio: "",
    location: "",
    publicEmail: "",
    website: "",
  });

  const mapUserToProfile = (user) => ({
    companyName: user.companyDetails?.companyName ?? "",
    tagline: user.companyDetails?.tagline ?? "",
    bio: user.companyDetails?.bio ?? "",
    location: user.companyDetails?.location ?? "",
    publicEmail: user.companyDetails?.publicEmail ?? "",
    website: user.companyDetails?.website ?? "",
    logoUrl: user.companyDetails?.logoUrl ?? "",
  });

  useEffect(() => {
    let timer = null;

    if (!isAuthentication) {
      setRedNotice(true);
      setNotice("Wallet not connected — redirecting to home...");
      timer = setTimeout(() => navigate("/"), 1600);
    } else if (address) {
      setNotice(null);
      loadProfileData();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAuthentication, address, navigate]);

  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    const loadReputationProfile = async () => {
      const nextProfile = await fetchReputationProfile(address);
      if (!cancelled) {
        setReputationProfile(nextProfile);
      }
    };

    loadReputationProfile();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const loadProfileData = async () => {
    if (!address) return;
    try {
      setIsLoading(true);

      const { data } = await api.get(
        "/api/client/get-client",
        {
          withCredentials: true,
        },
      );

      if (data.success && data.client) {
        setProfile(mapUserToProfile(data.client));
        setEditMode(false);
      } else {
        setEditMode(true);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setRedNotice(true);
      setNotice("Failed to load details — enter your info.");
      setEditMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserData = async () => {
    if (!editMode) {
      setEditMode(true);
      return;
    }

    if (!address) return;

    const {
      companyName,
      tagline,
      logoUrl,
      bio,
      location,
      publicEmail,
      website,
    } = profile;

    const payload = {
      companyDetails: {
        companyName,
        tagline,
        logoUrl,
        bio,
        location,
        publicEmail,
        website,
      },
    };

    try {
      setIsLoading(true);

      await api.put(
        "/api/client/update-profile",
        { payload },
        { withCredentials: true }
      );

      setNotice("Profile updated successfully ✨");
      setRedNotice(false);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setRedNotice(true);
      setNotice("Failed to update — try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfileCompletion = () => {
    const fields = Object.values(profile).map((v) => v?.trim());
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const completion = calculateProfileCompletion();

  return (
    <>
      <NoticeToast
        message={notice}
        isError={redNotice}
        onClose={() => setNotice(null)}
      />

      <div className="flex min-h-screen w-full overflow-x-clip bg-slate-50 pt-6 dark:bg-[#0f111d]">
        <div className="pointer-events-none absolute right-[1%] bottom-[20%] hidden h-[420px] w-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen dark:block"></div>
        <div className="pointer-events-none absolute left-[20%] top-[1%] hidden h-[420px] w-[120px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen dark:block"></div>
        <div className="hidden md:block">
          <SideBar />
        </div>

        <div className="flex-1 px-4 md:px-6 pb-8 max-w-7xl mx-auto w-full relative z-10">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <p
                style={orbitronStyle}
                className="mb-1 text-3xl font-extrabold tracking-widest text-slate-900 dark:text-white"
              >
                My Profile
              </p>
              <button
                onClick={updateUserData}
                className="px-4 py-2 bg-[#14a19f] hover:bg-[#1ecac7] text-white rounded transition-colors text-sm"
                style={robotoStyle}
              >
                {editMode ? "Save Profile" : "Edit Profile"}
              </button>
            </div>
          </div>

          <div className="mb-6 w-full rounded-lg border border-slate-200 bg-white p-6 backdrop-blur-sm dark:border-[#14a19f]/20 dark:bg-[#0d1224]/50">
            <div className="flex justify-between items-center mb-3">
              <p
                style={robotoStyle}
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                Profile Completion
              </p>
              <span
                className="text-[#14a19f] text-2xl font-bold"
                style={orbitronStyle}
              >
                {completion}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#0f111d]">
              <div
                className="bg-linear-to-r from-[#14a19f] to-[#1ecac7] h-full transition-all duration-500 relative"
                style={{ width: `${completion}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-4 backdrop-blur-sm dark:border-[#14a19f]/20 dark:bg-[#0d1224]/50">
                <h2
                  style={orbitronStyle}
                  className="mb-4 text-xl font-bold tracking-wide text-slate-900 dark:text-white"
                >
                  Company Details
                </h2>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row-reverse items-center gap-6">
                    <div className="shrink">
                      <img
                        src={
                          profile.logoUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${address}`
                        }
                        alt="Profile Avatar"
                        className="w-24 h-24 rounded-full object-cover border-2 border-[#14a19f]"
                      />
                    </div>
                    <div className="flex-1 w-full text-center sm:text-left">
                      <div>
                        <label
                          className="mb-2 block text-sm text-slate-600 dark:text-gray-400"
                          style={robotoStyle}
                        >
                          Company Name
                        </label>
                        {editMode ? (
                          <input
                            type="text"
                            value={profile.companyName}
                            onChange={(e) =>
                              handleInputChange("companyName", e.target.value)
                            }
                            className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-[#14a19f] dark:border-[#14a19f]/30 dark:bg-[#0f111d] dark:text-white"
                            style={robotoStyle}
                          />
                        ) : (
                          <p
                            className="text-lg font-bold text-slate-900 dark:text-white"
                            style={robotoStyle}
                          >
                            {profile.companyName || "Not set"}
                          </p>
                        )}
                      </div>
                      <div className="mt-4">
                        <label
                          className="mb-2 block text-sm text-slate-600 dark:text-gray-400"
                          style={robotoStyle}
                        >
                          Tag line
                        </label>
                        {editMode ? (
                          <input
                            type="text"
                            value={profile.tagline}
                            onChange={(e) =>
                              handleInputChange("tagline", e.target.value)
                            }
                            className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-[#14a19f] dark:border-[#14a19f]/30 dark:bg-[#0f111d] dark:text-white"
                            style={robotoStyle}
                          />
                        ) : (
                          <p className="text-lg text-slate-900 dark:text-white" style={robotoStyle}>
                            {profile.tagline || "Not set"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {editMode && (
                    <div>
                      <label
                        className="mb-2 block text-sm text-slate-600 dark:text-gray-400"
                        style={robotoStyle}
                      >
                        Logo Url
                      </label>
                      <input
                        type="text"
                        value={profile.logoUrl}
                        placeholder="https://example.com/image.png"
                        onChange={(e) =>
                          handleInputChange("logoUrl", e.target.value)
                        }
                        className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-[#14a19f] dark:border-[#14a19f]/30 dark:bg-[#0f111d] dark:text-white"
                        style={robotoStyle}
                      />
                    </div>
                  )}
                  <div>
                    <label
                      className="mb-2 block text-sm text-slate-600 dark:text-gray-400"
                      style={robotoStyle}
                    >
                      Bio
                    </label>
                    {editMode ? (
                      <textarea
                        value={profile.bio}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        rows={4}
                        className="w-full resize-none rounded border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-[#14a19f] dark:border-[#14a19f]/30 dark:bg-[#0f111d] dark:text-white"
                        style={robotoStyle}
                      />
                    ) : (
                      <p className="text-slate-800 dark:text-white" style={robotoStyle}>
                        {profile.bio || "Not set"}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="mb-2 flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400"
                        style={robotoStyle}
                      >
                        <MapPin size={16} /> Location
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={profile.location}
                          onChange={(e) =>
                            handleInputChange("location", e.target.value)
                          }
                          className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-[#14a19f] dark:border-[#14a19f]/30 dark:bg-[#0f111d] dark:text-white"
                          style={robotoStyle}
                        />
                      ) : (
                        <p className="text-slate-800 dark:text-white" style={robotoStyle}>
                          {profile.location || "Not set"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        className="mb-2 flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400"
                        style={robotoStyle}
                      >
                        <Mail size={16} />
                        Public Email
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={profile.publicEmail}
                          onChange={(e) =>
                            handleInputChange("publicEmail", e.target.value)
                          }
                          className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-[#14a19f] dark:border-[#14a19f]/30 dark:bg-[#0f111d] dark:text-white"
                          style={robotoStyle}
                        />
                      ) : (
                        <p className="text-slate-800 dark:text-white" style={robotoStyle}>
                          {profile.publicEmail || "Not set"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        className="mb-2 flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400"
                        style={robotoStyle}
                      >
                        <Mail size={16} />
                        Website Url
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={profile.website}
                          onChange={(e) =>
                            handleInputChange("website", e.target.value)
                          }
                          className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-[#14a19f] dark:border-[#14a19f]/30 dark:bg-[#0f111d] dark:text-white"
                          style={robotoStyle}
                        />
                      ) : (
                        <p className="text-slate-800 dark:text-white" style={robotoStyle}>
                          {profile.website || "Not set"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-6 backdrop-blur-sm dark:border-[#14a19f]/20 dark:bg-[#0d1224]/50">
                <ReputationSbtCard
                  reputationProfile={reputationProfile}
                  orbitronStyle={orbitronStyle}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ClientProfile;
