import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import SideBar from '../../components/SideBar';
import axios from "axios";
import { Award, Plus, X, Check, User, Mail, MapPin, Github, Linkedin, Twitter, Globe } from 'lucide-react';

function ClientProfile() {
    const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
    const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

    const { isConnected, address } = useAccount();
    const navigate = useNavigate();

    const [notice, setNotice] = useState(null);
    const [redNotice, setRedNotice] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [profile, setProfile] = useState({
        companyName: '',
        tagline: '',
        logoUrl: '',
        bio: '',
        location: '',
        publicEmail: '',
        website: ''
    });

    const mapUserToProfile = (user) => ({
        companyName: user.companyDetails?.companyName ?? '',
        tagline: user.companyDetails?.tagline ?? '',
        bio: user.companyDetails?.bio ?? '',
        location: user.companyDetails?.location ?? '',
        publicEmail: user.companyDetails?.publicEmail ?? '',
        website: user.companyDetails?.website ?? '',
        logoUrl: user.companyDetails?.logoUrl ?? ''
    });

    useEffect(() => {
        let timer = null;

        if (!isConnected) {
            setRedNotice(true);
            setNotice("Wallet not connected — redirecting to home...");
            timer = setTimeout(() => navigate('/'), 1600);
        } else if (address) {
            setNotice(null);
            loadProfileData();
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isConnected, address, navigate]);


    const loadProfileData = async () => {
        if (!address) return;

        const storedUserId = localStorage.getItem("userId");

        if (!storedUserId) {
            setRedNotice(true);
            setNotice("Redirecting home — userId not found!");
            setTimeout(() => navigate('/'), 1600);
            return;
        }

        try {
            setIsLoading(true);

            const { data } = await axios.post("http://localhost:5000/api/client/get-client", {
                address
            });

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
            website
        } = profile;

        const payload = {
            companyDetails: {
                companyName,
                tagline,
                logoUrl,
                bio,
                location,
                publicEmail,
                website
            }
        };

        try {
            setIsLoading(true);

            await axios.put(
                "http://localhost:5000/api/client/update-profile",
                { payload, address }
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
        const fields = Object.values(profile).map(v => v?.trim());
        const completed = fields.filter(Boolean).length;
        return Math.round((completed / fields.length) * 100);
    };

    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const completion = calculateProfileCompletion();



    return (
       <>

            {notice && (
                <div className="fixed top-4 right-4 z-50 animate-pulse">
                    <div className={`flex items-center gap-3 bg-[#14a19f] text-white px-4 py-2 rounded shadow-lg border border-[#1ecac7]/30 ${redNotice ? 'bg-red-600 border-red-700' : 'bg-[#14a19f] border-[#1ecac7]/30'} `}>
                        <div className="text-sm">{notice}</div>
                        <button
                            onClick={() => setNotice(null)}
                            className="ml-2 text-xs text-white/90 px-2 py-1 rounded hover:opacity-90 transition-opacity"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            <div className='dark:bg-[#0f111d] pt-6 flex bg-[#161c32] w-full min-h-screen  '>
                <div className="pointer-events-none absolute right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
                <div className="pointer-events-none absolute left-[20%] top-[1%] w-[120px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
                <div className="hidden md:block">
                    <SideBar />
                </div>


                <div className='flex-1  px-6 pb-8 max-w-7xl mx-auto w-full relative z-10'>
                    <div className='mb-8'>
                        <div className='flex justify-between items-center'>
                            <p style={orbitronStyle} className='text-white text-3xl tracking-widest font-extrabold mb-1'>
                                My Profile
                            </p>
                            <button
                                onClick={updateUserData}
                                className='px-4 py-2 bg-[#14a19f] hover:bg-[#1ecac7] text-white rounded transition-colors text-sm'
                                style={robotoStyle}
                            >
                                {editMode ? 'Save Profile' : 'Edit Profile'}
                            </button>
                        </div>
                    </div>

                    <div className='w-full backdrop-blur-sm  rounded-lg p-6 mb-6 border border-[#14a19f]/20'>
                        <div className='flex justify-between items-center mb-3'>
                            <p style={robotoStyle} className='text-white text-lg font-semibold'>
                                Profile Completion
                            </p>
                            <span className='text-[#14a19f] text-2xl font-bold' style={orbitronStyle}>
                                {completion}%
                            </span>
                        </div>
                        <div className='w-full bg-[#0f111d] rounded-full h-3 overflow-hidden'>
                            <div
                                className='bg-linear-to-r from-[#14a19f] to-[#1ecac7] h-full transition-all duration-500 relative'
                                style={{ width: `${completion}%` }}
                            >
                                <div className='absolute inset-0 bg-white/20 animate-pulse'></div>
                            </div>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                        <div className='lg:col-span-2 space-y-6'>

                            <div className='backdrop-blur-sm rounded-lg p-6 border border-[#14a19f]/20'>
                                <h2 style={orbitronStyle} className='text-white text-xl font-bold mb-4 tracking-wide'>
                                    Company Details
                                </h2>
                                <div className='space-y-4'>
                                    <div className='flex flex-col sm:flex-row-reverse items-center gap-6'>
                                        <div className='shrink'>

                                            <img
                                                src={profile.logoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${address}`}
                                                alt="Profile Avatar"
                                                className='w-24 h-24 rounded-full object-cover border-2 border-[#14a19f]'
                                            />
                                        </div>
                                        <div className='flex-1 w-full text-center sm:text-left'>
                                            <div>
                                                <label className='text-gray-400 text-sm mb-2 block' style={robotoStyle}>Company Name</label>
                                                {editMode ? (
                                                    <input
                                                        type='text'
                                                        value={profile.companyName}
                                                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                                                        className='w-full backdrop-blur-lg  text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                                                        style={robotoStyle}
                                                    />
                                                ) : (
                                                    <p className='text-white font-bold text-lg' style={robotoStyle}>{profile.companyName || 'Not set'}</p>
                                                )}
                                            </div>
                                            <div className='mt-4'>
                                                <label className='text-gray-400 text-sm mb-2 block' style={robotoStyle}>Tag line</label>
                                                {editMode ? (
                                                    <input
                                                        type='text'
                                                        value={profile.tagline}
                                                        onChange={(e) => handleInputChange('tagline', e.target.value)}
                                                        className='w-full backdrop-blur-lg text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                                                        style={robotoStyle}
                                                    />
                                                ) : (
                                                    <p className='text-white text-lg' style={robotoStyle}>{profile.tagline || 'Not set'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {editMode && (
                                        <div>
                                            <label className='text-gray-400 text-sm mb-2 block' style={robotoStyle}>Logo Url</label>
                                            <input
                                                type='text'
                                                value={profile.logoUrl}
                                                placeholder='https://example.com/image.png'
                                                onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                                                className='w-full backdrop-blur-lg text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                                                style={robotoStyle}
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className='text-gray-400 text-sm mb-2 block' style={robotoStyle}>Bio</label>
                                        {editMode ? (
                                            <textarea
                                                value={profile.bio}
                                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                                rows={4}
                                                className='w-full backdrop-blur-lg text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none resize-none'
                                                style={robotoStyle}
                                            />
                                        ) : (
                                            <p className='text-white' style={robotoStyle}>{profile.bio || 'Not set'}</p>
                                        )}
                                    </div>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <div>
                                            <label className='text-gray-400 text-sm mb-2  flex items-center gap-2' style={robotoStyle}>
                                                <MapPin size={16} /> Location
                                            </label>
                                            {editMode ? (
                                                <input
                                                    type='text'
                                                    value={profile.location}
                                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                                    className='w-full backdrop-blur-lg text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                                                    style={robotoStyle}
                                                />
                                            ) : (
                                                <p className='text-white' style={robotoStyle}>{profile.location || 'Not set'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className='text-gray-400 text-sm mb-2  flex items-center gap-2' style={robotoStyle}>
                                                <Mail size={16} />Public Email
                                            </label>
                                            {editMode ? (
                                                <input
                                                    type='text'
                                                    value={profile.publicEmail}
                                                    onChange={(e) => handleInputChange('publicEmail', e.target.value)}
                                                    className='w-full backdrop-blur-lg text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                                                    style={robotoStyle}
                                                />
                                            ) : (
                                                <p className='text-white' style={robotoStyle}>{profile.publicEmail || 'Not set'}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className='text-gray-400 text-sm mb-2  flex items-center gap-2' style={robotoStyle}>
                                                <Mail size={16} />Website Url
                                            </label>
                                            {editMode ? (
                                                <input
                                                    type='text'
                                                    value={profile.website}
                                                    onChange={(e) => handleInputChange('website', e.target.value)}
                                                    className='w-full backdrop-blur-lg text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                                                    style={robotoStyle}
                                                />
                                            ) : (
                                                <p className='text-white' style={robotoStyle}>{profile.website || 'Not set'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ClientProfile