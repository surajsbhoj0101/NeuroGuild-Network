import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import SideBar from '../../components/SideBar';
import api from "../../utils/api.js"

import { Lock, Award, Check, User, Mail, MapPin, Github, Linkedin, Twitter, Globe, Brain, Code, Palette, Database, Globe as GlobeIcon, Zap } from 'lucide-react';

const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

export default function MyProfile() {
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);
  const [sbt, setSbt] = useState(null)
  const [isLoading, setIsLoading] = useState(false);
  const [minted, setMinted] = useState([])
  const [skillTokenizable, setSkillTokenizable] = useState([])


  const [profile, setProfile] = useState({
    displayName: '', bio: '', title: '', location: '', email: '',
    github: '', linkedin: '', twitter: '', website: '', hourlyRate: '',
    experience: '', availability: 'available', avatarUrl: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getSkillIcon = (skillName) => {
    const lowerSkill = skillName.toLowerCase();
    if (lowerSkill.includes('javascript') || lowerSkill.includes('js') || lowerSkill.includes('react') || lowerSkill.includes('node')) return Code;
    if (lowerSkill.includes('design') || lowerSkill.includes('ui') || lowerSkill.includes('ux')) return Palette;
    if (lowerSkill.includes('database') || lowerSkill.includes('sql') || lowerSkill.includes('mongo')) return Database;
    if (lowerSkill.includes('web') || lowerSkill.includes('html') || lowerSkill.includes('css')) return GlobeIcon;
    if (lowerSkill.includes('ai') || lowerSkill.includes('ml') || lowerSkill.includes('machine')) return Brain;
    if (lowerSkill.includes('blockchain') || lowerSkill.includes('crypto') || lowerSkill.includes('smart contract')) return Zap;
    return Brain; // default
  };



  const mapUserToProfile = (user) => ({
    displayName: user.BasicInformation?.name || '',
    title: user.BasicInformation?.title || '',
    bio: user.BasicInformation?.bio || '',
    location: user.BasicInformation?.location || '',
    email: user.BasicInformation?.email || '',
    github: user.SocialLinks?.github || '',
    linkedin: user.SocialLinks?.linkedIn || '',
    twitter: user.SocialLinks?.twitter || '',
    website: user.SocialLinks?.website || '',
    hourlyRate: user.ProfessionalDetails?.hourlyRate || '',
    experience: user.ProfessionalDetails?.experience || '',
    availability: user.ProfessionalDetails?.availability || 'available',
    avatarUrl: user.BasicInformation?.avatarUrl || ''
  });

  useEffect(() => {
    let t;
    if (!isConnected) {
      setRedNotice(true);
      setNotice("Wallet not connected — redirecting to home...");
      t = setTimeout(() => navigate('/'), 1600);
    } else if (address) {
      setNotice(null);
      loadProfileData();
    }
    //Note:
    /*
      User opens the page → isConnected = false → setTimeout starts.

      Before 1.6s, user connects wallet → isConnected = true.

      Effect runs again:

        Cleanup triggers → clearTimeout(t) cancels the old redirect.

        loadProfileData() runs instead.

      This ensures only the latest intended behavior happens.
    */
    return () => clearTimeout(t);
  }, [isConnected, navigate, address]);

  const loadProfileData = async () => {
    if (!address) return;



    try {
      const response = await api.get(
        "http://localhost:5000/api/freelancer/get-freelancer",
        {
          withCredentials: true
        }
      );

      if (response.data.success && response.data.freelancer) {
        const user = response.data.freelancer;
        setProfile(mapUserToProfile(user));

        setSkillTokenizable(response.data.skillTokenizable)
      } else {
        // Even if freelancer not found, set skillTokenizable if available
        if (response.data.skillTokenizable) {
          setSkillTokenizable(response.data.skillTokenizable);
        }
        setEditMode(true);
      }
    } catch (e) {
      console.error("Error loading profile:", e);
      setRedNotice(true);
      setNotice("Failed to load the profile");
      setEditMode(true);
    }
  };


  const calculateProfileCompletion = () => {
    const fields = [
      profile.avatarUrl, profile.displayName, profile.bio, profile.title,
      profile.location, profile.email, profile.hourlyRate, profile.experience,
      profile.github || profile.linkedin || profile.twitter || profile.website
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };


  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const completion = calculateProfileCompletion();

  const updateUserData = async () => {
    if (!editMode) {
      setEditMode(true);
      return;
    }

    try {
      if (!address) return;
      const payload = {
        BasicInformation: {
          name: profile.displayName, title: profile.title, bio: profile.bio,
          location: profile.location, email: profile.email, avatarUrl: profile.avatarUrl,
        },
        ProfessionalDetails: {
          hourlyRate: profile.hourlyRate, experience: profile.experience,
          availability: profile.availability,
        },
        SocialLinks: {
          github: profile.github, linkedIn: profile.linkedin,
          twitter: profile.twitter, website: profile.website,
        }
      };
      console.log('Sending payload:', payload);
      const response = await api.put(`http://localhost:5000/api/freelancer/update-profile`, { payload }, { withCredentials: true });
      console.log('Update response:', response);
      setRedNotice(false);
      setNotice("Profile updated successfully");
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setRedNotice(true);
      setNotice(error.response?.data?.message || "Failed to update profile");
      // Keep edit mode on error
    }
  };

  const mintSBTForSkill = async (skill) => {
    try {
      const res = await api.post(
        "http://localhost:5000/api/auth/check-skill-name",
        { skillName: skill },
        { withCredentials: true }
      );

      if (!res.data?.success) {
        navigate("/");
        return;
      }

      navigate("/mint-rules");
    } catch (error) {
      navigate("/");
    }
  };





  useEffect(() => {
    if (!address) return;

    async function getSbt() {
      setIsLoading(true);

      try {
        const response = await api.post("http://localhost:5000/api/freelancer/fetch-sbt/", { address });
        const data = response.data;

        if (data.success && data.sbt) {
          setSbt(data.sbt);
          console.log(sbt)
        } else {
          setSbt(null); // No SBT found or no URI
          console.log(data.message || "No SBT found for this address.");
        }
      } catch (err) {
        console.error("Error fetching SBT:", err.message);

      } finally {
        setIsLoading(false);
      }
    }

    getSbt();
  }, [address]);




  const sbts = sbt?.skills || []; // extract skill array safely

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

        <div className='flex-1 px-6 pb-8 max-w-7xl mx-auto w-full relative z-10'>
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

          <div className='backdrop-blur-sm rounded-lg p-6 mb-6 border border-[#14a19f]/20'>
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
                  Basic Information
                </h2>
                <div className='space-y-4'>
                  <div className='flex flex-col sm:flex-row-reverse items-center gap-6'>
                    <div className='shrink'>
                      <div className='shrink'>
                        <img
                          src={profile.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${address}`}
                          alt="Profile Avatar"
                          className='w-24 h-24 rounded-full object-cover border-2 border-[#14a19f]'
                        />
                      </div>
                    </div>
                    <div className='flex-1 w-full text-center sm:text-left'>
                      <div>
                        <label className='text-gray-400 text-sm mb-2 block' style={robotoStyle}>Display Name</label>
                        {editMode ? (
                          <input
                            type='text'
                            value={profile.displayName}
                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                            className='w-full backdrop-blur-lg text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                            style={robotoStyle}
                          />
                        ) : (
                          <p className='text-white text-lg' style={robotoStyle}>{profile.displayName || 'Not set'}</p>
                        )}
                      </div>
                      <div className='mt-4'>
                        <label className='text-gray-400 text-sm mb-2 block' style={robotoStyle}>Professional Title</label>
                        {editMode ? (
                          <input
                            type='text'
                            value={profile.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                            style={robotoStyle}
                          />
                        ) : (
                          <p className='text-white text-lg' style={robotoStyle}>{profile.title || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {editMode && (
                    <div>
                      <label className='text-gray-400 text-sm mb-2 block' style={robotoStyle}>Avatar Image URL</label>
                      <input
                        type='text'
                        value={profile.avatarUrl}
                        placeholder='https://example.com/image.png'
                        onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                        className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
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
                        className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none resize-none'
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
                          className='w-full backdrop-blur-sm] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                          style={robotoStyle}
                        />
                      ) : (
                        <p className='text-white' style={robotoStyle}>{profile.location || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className='text-gray-400 text-sm mb-2  flex items-center gap-2' style={robotoStyle}>
                        <Mail size={16} /> Email
                      </label>
                      {editMode ? (
                        <input
                          type='email'
                          value={profile.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                          style={robotoStyle}
                        />
                      ) : (
                        <p className='text-white' style={robotoStyle}>{profile.email || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className='backdrop-blur-sm rounded-lg p-6 border border-[#14a19f]/20'>
                <h2 style={orbitronStyle} className='text-white text-xl font-bold mb-4 tracking-wide'>
                  Professional Details
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label className='text-gray-400 text-sm mb-2 block' style={robotoStyle}>Hourly Rate (USD)</label>
                    {editMode ? (
                      <input
                        type='number'
                        value={profile.hourlyRate}
                        onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                        className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                        style={robotoStyle}
                      />
                    ) : (
                      <p className='text-white text-lg' style={robotoStyle}>${profile.hourlyRate || '0'}/hr</p>
                    )}
                  </div>
                  <div>
                    <label className='text-gray-400 text-sm mb-2 block' style={robotoStyle}>Experience</label>
                    {editMode ? (
                      <input
                        type='text'
                        value={profile.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                        style={robotoStyle}
                      />
                    ) : (
                      <p className='text-white' style={robotoStyle}>{profile.experience || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className='text-gray-400 text-sm mb-2 block' style={robotoStyle}>Availability</label>
                    {editMode ? (
                      <select
                        value={profile.availability}
                        onChange={(e) => handleInputChange('availability', e.target.value)}
                        className='w-full dark:bg-[#0f111d] bg-[#14a19f]  text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a1f] outline-none'
                        style={robotoStyle}
                      >
                        <option value='available'>Available</option>
                        <option value='busy'>Busy</option>
                        <option value='unavailable'>Unavailable</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-3 py-1 rounded text-sm ${profile.availability === 'available' ? 'bg-green-500/20 text-green-400' :
                        profile.availability === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`} style={robotoStyle}>
                        {profile.availability.charAt(0).toUpperCase() + profile.availability.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className='backdrop-blur-sm rounded-lg p-6 border border-[#14a19f]/20'>
                <h2 style={orbitronStyle} className='text-white text-xl font-bold mb-4 tracking-wide'>Social Links</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-gray-400 text-sm mb-2  flex items-center gap-2' style={robotoStyle}><Github size={16} /> GitHub Username</label>
                    {editMode ? (
                      <input
                        type='text'
                        value={profile.github}
                        onChange={(e) => handleInputChange('github', e.target.value)}
                        className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                        style={robotoStyle}
                      />
                    ) : (
                      <p className='text-white' style={robotoStyle}>{profile.github || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className='text-gray-400 text-sm mb-2  flex items-center gap-2' style={robotoStyle}><Linkedin size={16} /> LinkedIn Username</label>
                    {editMode ? (
                      <input
                        type='text'
                        value={profile.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                        style={robotoStyle}
                      />
                    ) : (
                      <p className='text-white' style={robotoStyle}>{profile.linkedin || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className='text-gray-400 text-sm mb-2   items-center flex gap-2' style={robotoStyle}><Twitter size={16} /> <p>Twitter Username</p></label>
                    {editMode ? (
                      <input
                        type='text'
                        value={profile.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                        style={robotoStyle}
                      />
                    ) : (
                      <p className='text-white' style={robotoStyle}>{profile.twitter || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className='text-gray-400 text-sm mb-2  flex items-center gap-2' style={robotoStyle}><Globe size={16} /> Website/Portfolio</label>
                    {editMode ? (
                      <input
                        type='text'
                        value={profile.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                        style={robotoStyle}
                      />
                    ) : (
                      <p className='text-white' style={robotoStyle}>{profile.website || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>


              <div className='backdrop-blur-sm min-h-40 relative overflow-auto  rounded-lg p-6 border border-[#14a19f]/20 '>
                <div className='flex  justify-between items-center mb-4'>
                  <h2 style={orbitronStyle} className='text-white text-xl font-bold tracking-wide'>Skills</h2>
                </div>

                <div className='mb-4'>
                  <input
                    type='text'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder='Search skills...'
                    className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                    style={robotoStyle}
                  />
                </div>

                <div className='space-y-3 max-h-96 overflow-y-auto scrollable'>
                  {(() => {
                    const filteredSkills = skillTokenizable.filter(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())).sort();
                    return filteredSkills.length > 0 ? filteredSkills.map((skill, idx) => {
                      const isMinted = sbts.some(sbt => sbt.name === skill);
                      const SkillIcon = getSkillIcon(skill);
                      return (
                        <div
                          key={idx}
                          className="group relative flex items-center bg-gradient-to-r from-slate-800/90 to-slate-900/90 dark:from-[#1a1f2b]/90 dark:to-[#141620]/90 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 hover:border-[#14a19f]/60 hover:shadow-[0_0_15px_#14a19f30] transition-all duration-500 shadow-md hover:shadow-lg overflow-hidden"
                        >
                          {/* Background decoration */}
                          <div className="absolute inset-0 bg-gradient-to-r from-[#14a19f]/5 via-transparent to-[#1ecac7]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                          <div className="relative z-10 flex items-center justify-between w-full">
                            {/* Left side - Icon and Title */}
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-2 bg-[#14a19f]/20 rounded-lg group-hover:bg-[#14a19f]/30 transition-colors duration-300">
                                <SkillIcon className="w-6 h-6 text-[#14a19f] group-hover:text-[#1ecac7] transition-colors duration-300" />
                              </div>
                              <div className="flex-1">
                                <p
                                  className="text-gray-100 font-bold text-lg leading-tight group-hover:text-white transition-colors duration-300"
                                  style={robotoStyle}
                                >
                                  {skill}
                                </p>
                              </div>
                            </div>

                            {/* Right side - Status and Button */}
                            <div className="flex items-center gap-4">
                              {/* Status Badge */}
                              {isMinted ? (
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium border border-green-500/30">
                                  <Check size={14} />
                                  Verified
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium border border-amber-500/30">
                                  <Award size={14} />
                                  Available
                                </div>
                              )}

                              {/* Button */}
                              {isMinted ? (
                                <button
                                  disabled={true}
                                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 cursor-not-allowed"
                                  style={robotoStyle}
                                >
                                  <Check size={16} />
                                  Minted
                                </button>
                              ) : (
                                <button
                                  onClick={() => mintSBTForSkill(skill)}
                                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#14a19f] to-[#1ecac7] text-white rounded-lg hover:shadow-lg hover:shadow-[#14a19f]/25 hover:scale-105 transition-all duration-300 border border-[#14a19f]/50"
                                  style={robotoStyle}
                                >
                                  <Award size={16} />
                                  Mint SBT
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <p className='text-gray-500 text-sm text-center py-8' style={robotoStyle}>No matching skills found</p>
                    );
                  })()}
                </div>
              </div>
            </div>


            <div className="lg:col-span-1">
              <div className="backdrop-blur-sm rounded-lg p-6 border border-[#14a19f]/20 sticky top-6">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="text-[#14a19f]" size={24} />
                  <h2 style={orbitronStyle} className="text-white text-xl font-bold tracking-wide">
                    Soul Bound Tokens
                  </h2>
                </div>

                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Loading your SBT...</div>
                  ) : sbts.length > 0 ? (
                    sbts.map((skill, index) => (
                      <div
                        key={index}
                        className="dark:bg-[#0f111d]/10 backdrop-blur-lg bg-[#141a2c]/10 p-4 rounded-lg border  border-[#14a19f]/30 hover:border-[#14a19f] transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-sm mb-1" style={robotoStyle}>
                              {skill.name}
                            </h3>
                            <p className="text-gray-400 text-xs mb-2" style={robotoStyle}>
                              Issued by {skill.badge.issuer}
                            </p>
                          </div>
                          <Award className="text-[#14a19f] group-hover:scale-110 transition-transform" size={20} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500" style={robotoStyle}>
                            {skill.badge.date}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${skill.level === "Master"
                              ? "bg-purple-500/20 text-purple-400"
                              : skill.level === "Expert"
                                ? "bg-blue-500/20 text-blue-400"
                                : skill.level === "Advanced"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}
                            style={robotoStyle}
                          >
                            {skill.level}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Award className="text-gray-600 mx-auto mb-3" size={48} />
                      <p className="text-gray-500 text-sm" style={robotoStyle}>
                        No SBTs earned yet. Add skills to earn certificates!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}