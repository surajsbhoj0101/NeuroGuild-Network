import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import SideBar from '../../components/SideBar';
import axios from "axios";
import skillTokenizable from '../../utils/tokenizableSkills';
import { Lock, Award, Plus, X, Check, User, Mail, MapPin, Github, Linkedin, Twitter, Globe } from 'lucide-react';

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


  const [profile, setProfile] = useState({
    displayName: '', bio: '', title: '', location: '', email: '',
    github: '', linkedin: '', twitter: '', website: '', hourlyRate: '',
    experience: '', availability: 'available', avatarUrl: ''
  });

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [editMode, setEditMode] = useState(false);



  const mapUserToSkills = (user) => (
    user.skills?.map(skill => ({
      name: skill.name,
      sbtAddress: skill.sbtAddress,
      minted: skill.minted || false,
      active: skill.active ?? true, //The ?? operator returns the right-hand value only if the left-hand value is null or undefined.
      tokenId: skill.tokenId || null
    })) || []
  );

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
      const response = await axios.post(
        "http://localhost:5000/api/freelancer/get-freelancer",
        {
          address
        }
      );

      if (response.data.success && response.data.freelancer) {
        const user = response.data.freelancer;
        setProfile(mapUserToProfile(user));

        const userSkills = mapUserToSkills(user);
        setSkills(userSkills);
      } else {
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
      skills.length > 0,
      profile.github || profile.linkedin || profile.twitter || profile.website
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };


  const addSkill = () => {
    const skillName = newSkill.trim();

    if (skillName && !skills.some(s => s.name === skillName)) {

      const newSkillObject = {
        name: skillName,
        minted: false,
        active: true,
        sbtAddress: null, // Add this
        tokenId: null      // Add this
      };

      setSkills([...skills, newSkillObject]);
      setNewSkill('');
      setShowSkillInput(false);
      setRedNotice(false);
      setNotice(`'${skillName}' was added. Remember to save your profile.`);
      setTimeout(() => setNotice(null), 6000);
    }
  };


  const removeSkill = (skillNameToRemove) => {
    setSkills(skills.filter(s => s.name !== skillNameToRemove));
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
        },


        skills: skills
      };
      console.log(payload)
      await axios.put(`http://localhost:5000/api/freelancer/update-profile`, { payload, address });
      setRedNotice(false)
      setNotice("Profile updated successfully");

      setEditMode(false); // Only exit edit mode on success.
    } catch (error) {
      console.error('Error updating profile:', error);
      setRedNotice(true);
      setNotice("Failed to upload profile")

      // Do NOT exit edit mode if the save fails.
    }
  };

  const mintSBTForSkill = (skill) => {
    navigate(`/verify-skill/${skill}`)
  };




  useEffect(() => {
    if (!address) return;

    async function getSbt() {
      setIsLoading(true);

      try {
        const response = await axios.post("http://localhost:5000/api/freelancer/fetch-sbt/", { address });
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
                  {editMode && (
                    <button
                      onClick={() => setShowSkillInput(prev => !prev)}
                      className={`flex items-center gap-2 px-3 py-2 text-white rounded transition-colors text-sm ${showSkillInput ? 'bg-red-500 hover:bg-red-600' : 'bg-[#14a19f] hover:bg-[#1ecac7]'
                        }`}
                      style={robotoStyle}
                    >
                      {showSkillInput ? null : <Plus size={16} />} {showSkillInput ? 'Cancel' : 'Add Skill'}
                    </button>
                  )}
                </div>
                {showSkillInput && editMode && (
                  <div className=' relative mb-4'>
                    <div className='flex gap-2'>
                      <div className='flex-1'>
                        <input
                          type='text'
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder='Select a skill'
                          className='w-full backdrop-blur-sm text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                          style={robotoStyle}
                          autoFocus
                        />
                        {newSkill && (
                          <ul className='absolute top-full mt-1 left-0 right-0 bg-[#141620] border border-[#14a19f]/30 rounded-lg max-h-40 overflow-y-auto z-50 shadow-lg'>
                            {skillTokenizable

                              .filter(skill => !skills.some(s => s.name === skill) && skill.toLowerCase().includes(newSkill.toLowerCase()))
                              .map((skill, idx) => (
                                <li
                                  key={idx}
                                  className='px-4 py-2 cursor-pointer hover:bg-[#14a19f]/20 text-white'
                                  onClick={() => { setNewSkill(skill); }}
                                >
                                  {skill}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                      <button
                        onClick={addSkill}
                        className='px-4 py-2 bg-[#14a19f] hover:bg-[#1ecac7] text-white rounded transition-colors'
                      ><Check size={20} /></button>
                    </div>
                  </div>
                )}


                <div className='flex flex-wrap gap-3'>
                  {skills.length > 0 ? skills.map((skillObj, idx) => (
                    <div
                      key={idx}
                      className="group relative flex flex-col bg-slate-800 dark:bg-[#1a1f2b]/80 backdrop-blur-md rounded-xl p-4 w-52 border border-transparent hover:border-[#14a19f] hover:shadow-[0_0_20px_#14a19f33] transition-all duration-300 shadow-md"
                    >

                      <div className="flex justify-between items-center mb-2">
                        <p
                          className="text-gray-100 font-extrabold text-lg leading-snug truncate"
                          style={robotoStyle}
                          title={skillObj.name}
                        >
                          {skillObj.name}
                        </p>
                        {editMode && (
                          <button
                            onClick={() => removeSkill(skillObj.name)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label={`Remove skill: ${skillObj.name}`}
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>


                      {skillTokenizable.includes(skillObj.name) ? <p className="text-[10px] text-[#14a19f] font-mono mb-3 uppercase tracking-wide">
                        Tokenizable Skill
                      </p> : <p className="text-[10px] text-gray-500 font-mono mb-3 uppercase tracking-wide">
                        Non-Tokenizable
                      </p>}

                      {skillTokenizable.includes(skillObj.name) ? (

                        skillObj.minted ? (
                          // Is MINTED
                          <button
                            disabled={true}
                            className="flex items-center justify-center gap-2 w-full mt-auto text-sm font-bold bg-green-500/20 text-green-400 py-2.5 rounded-lg"
                            style={robotoStyle}
                          >
                            Already Minted <Check size={16} />
                          </button>
                        ) : (

                          <button
                            onClick={() => mintSBTForSkill(skillObj.name)}
                            className="flex items-center justify-center gap-2 w-full mt-auto text-sm font-bold bg-linear-to-r from-[#14a19f] to-[#1ecac7] text-[#0f111d] py-2.5 rounded-lg hover:scale-105 hover:shadow-[0_0_15px_#1ecac7] transition-all duration-300 shadow-md"
                            style={robotoStyle}
                          >
                            Mint SBT <Award size={16} />
                          </button>
                        )
                      ) : (

                        <button
                          disabled={true}
                          className="flex items-center justify-center gap-2 w-full mt-auto text-sm font-bold bg-gray-700/50 text-gray-500 py-2.5 rounded-lg"
                          style={robotoStyle}
                        >
                          Not Tokenizable <Award size={16} />
                        </button>
                      )}
                    </div>

                  )) : (
                    <p className='text-gray-500 text-sm' style={robotoStyle}>No skills added yet</p>
                  )}
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