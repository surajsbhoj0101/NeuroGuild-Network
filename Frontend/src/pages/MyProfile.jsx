import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import SideBar from '../components/SideBar';
import axios from "axios";
import skillTokenizable from '../utils/tokenizableSkills';
import { Award, Plus, X, Check, User, Mail, MapPin, Github, Linkedin, Twitter, Globe } from 'lucide-react';

const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

export default function MyProfile() {
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);




  const [profile, setProfile] = useState({
    displayName: '', bio: '', title: '', location: '', email: '',
    github: '', linkedin: '', twitter: '', website: '', hourlyRate: '',
    experience: '', availability: 'available', avatarUrl: ''
  });

  const [skills, setSkills] = useState([]);
  const [sbts, setSbts] = useState([]);
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
    avatarUrl: user.avatarUrl || ''
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
      const response = await axios.get(`http://localhost:5000/get-user/${address}`);
      if (response.data.success && response.data.user) {
        const user = response.data.user;
        setProfile(mapUserToProfile(user));

        const userSkills = mapUserToSkills(user);
        // BUG FIX: Set skills state to an array of strings (skill names).
        setSkills(userSkills.map(s => s.name)); //creates a new array containing only the names

        /*  
          let arr = [1,2,3,4]
          let a = arr.filter(a => a%2 == 0 ).map(a=>a*2);
          [ 4, 8 ]
         */
        const loadedSbts = userSkills
          .filter(skill => skill.minted)
          .map(skill => ({
            id: skill.tokenId || skill.sbtAddress || skill.name,
            name: `${skill.name} Certification`,
            issuer: 'SkillChain Protocol',
            date: new Date().toISOString().split('T')[0], // Placeholder
            level: 'Beginner' // Placeholder
          }));
        setSbts(loadedSbts);

      } else {
        setEditMode(true);
      }
    } catch (e) {
      console.error("Error loading profile:", e);
      setRedNotice(true);
      setNotice("Failed to load the profile")
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
    const skill = newSkill.trim();
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]); //first spread using ...skills the add skill
      setNewSkill('');
      setShowSkillInput(false);
      setRedNotice(false);
      setNotice(`'${skill}' was added. Remember to save your profile.`);
      setTimeout(() => setNotice(null), 6000);
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const completion = calculateProfileCompletion();

  // BUG FIX: Refactored logic to be more robust.
  const updateUserData = async () => {
    // If we are NOT in edit mode, the button's job is to ENTER edit mode.
    if (!editMode) {
      setEditMode(true);
      return;
    }

    // If we ARE in edit mode, the button's job is to SAVE.
    try {
      if (!address) return;
      const payload = {
        BasicInformation: {
          name: profile.displayName, title: profile.title, bio: profile.bio,
          location: profile.location, email: profile.email,
        },
        ProfessionalDetails: {
          hourlyRate: profile.hourlyRate, experience: profile.experience,
          availability: profile.availability,
        },
        SocialLinks: {
          github: profile.github, linkedIn: profile.linkedin,
          twitter: profile.twitter, website: profile.website,
        },
        // BUG FIX: Correctly map the array of skill strings to the required payload format.
        skills: skills.map(skillName => ({ name: skillName }))
      };

      await axios.put(`http://localhost:5000/update-profile/${address}`, payload);
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

  return (
    <>
      {/* ... The rest of your JSX remains unchanged ... */}
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
        <div className="pointer-events-none absolute right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
        <div className="pointer-events-none absolute left-[20%] top-[1%] w-[120px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
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

          <div className='bg-[#1a2139] dark:bg-[#070d1a] rounded-lg p-6 mb-6 border border-[#14a19f]/20'>
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
                className='bg-gradient-to-r from-[#14a19f] to-[#1ecac7] h-full transition-all duration-500 relative'
                style={{ width: `${completion}%` }}
              >
                <div className='absolute inset-0 bg-white/20 animate-pulse'></div>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2 space-y-6'>
              <div className='bg-[#1a2139] dark:bg-[#070d1a] rounded-lg p-6 border border-[#14a19f]/20'>
                <h2 style={orbitronStyle} className='text-white text-xl font-bold mb-4 tracking-wide'>
                  Basic Information
                </h2>
                <div className='space-y-4'>
                  <div className='flex flex-col sm:flex-row-reverse items-center gap-6'>
                    <div className='flex-shrink-0'>
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${address}`}
                        alt="Profile Avatar"
                        className='w-24 h-24 rounded-full object-cover border-2 border-[#14a19f]'
                      />
                    </div>
                    <div className='flex-1 w-full text-center sm:text-left'>
                      <div>
                        <label className='text-gray-400 text-sm mb-2 block' style={robotoStyle}>Display Name</label>
                        {editMode ? (
                          <input
                            type='text'
                            value={profile.displayName}
                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                            className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
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
                            className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
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
                        className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
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
                        className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none resize-none'
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
                          className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
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
                          className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                          style={robotoStyle}
                        />
                      ) : (
                        <p className='text-white' style={robotoStyle}>{profile.email || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className='bg-[#1a2139] dark:bg-[#070d1a] rounded-lg p-6 border border-[#14a19f]/20'>
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
                        className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
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
                        className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
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
                        className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
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
              <div className='bg-[#1a2139] dark:bg-[#070d1a] rounded-lg p-6 border border-[#14a19f]/20'>
                <h2 style={orbitronStyle} className='text-white text-xl font-bold mb-4 tracking-wide'>Social Links</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-gray-400 text-sm mb-2  flex items-center gap-2' style={robotoStyle}><Github size={16} /> GitHub Username</label>
                    {editMode ? (
                      <input
                        type='text'
                        value={profile.github}
                        onChange={(e) => handleInputChange('github', e.target.value)}
                        className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
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
                        className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
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
                        className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
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
                        className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                        style={robotoStyle}
                      />
                    ) : (
                      <p className='text-white' style={robotoStyle}>{profile.website || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className='bg-[#1a2139] min-h-40 relative overflow-auto dark:bg-[#070d1a] rounded-lg p-6 border border-[#14a19f]/20 '>
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
                          className='w-full bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                          style={robotoStyle}
                          autoFocus
                        />
                        {newSkill && (
                          <ul className='absolute top-full mt-1 left-0 right-0 bg-[#141620] border border-[#14a19f]/30 rounded-lg max-h-40 overflow-y-auto z-50 shadow-lg'>
                            {skillTokenizable
                              .filter(skill => !skills.includes(skill) && skill.toLowerCase().includes(newSkill.toLowerCase()))
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
                  {skills.length > 0 ? skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="group relative flex flex-col bg-slate-800 dark:bg-[#1a1f2b]/80 backdrop-blur-md rounded-xl p-4 w-52 border border-transparent hover:border-[#14a19f] hover:shadow-[0_0_20px_#14a19f33] transition-all duration-300 shadow-md"
                    >
                      {/* Skill Header */}
                      <div className="flex justify-between items-center mb-2">
                        <p
                          className="text-gray-100 font-extrabold text-lg leading-snug truncate"
                          style={robotoStyle}
                          title={skill}
                        >
                          {skill}
                        </p>
                        {editMode && (
                          <button
                            onClick={() => removeSkill(skill)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label={`Remove skill: ${skill}`}
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      {/* Tokenizable Badge */}
                      {skillTokenizable.includes(skill) ? <p className="text-[10px] text-[#14a19f] font-mono mb-3 uppercase tracking-wide">
                        Tokenizable Skill
                      </p> : <p className="text-[10px] text-[#14a19f] font-mono mb-3 uppercase tracking-wide">
                        Non  Tokenizable Skill
                      </p>}

                      {/* Mint SBT Button */}
                      {skillTokenizable.includes(skill) ? <button
                        onClick={() => mintSBTForSkill(skill)}
                        className="flex items-center justify-center gap-2 w-full mt-auto text-sm font-bold bg-gradient-to-r from-[#14a19f] to-[#1ecac7] text-[#0f111d] py-2.5 rounded-lg hover:scale-105 hover:shadow-[0_0_15px_#1ecac7] transition-all duration-300 shadow-md"
                        style={robotoStyle}
                      >
                        Mint SBT <Award size={16} />
                      </button> : <button
                        disabled={true}
                        className="flex items-center justify-center gap-2 w-full mt-auto text-sm font-bold bg-gradient-to-r from-gray-800 to-gray-900 text-[#0f111d] py-2.5 rounded-lg  "
                        style={robotoStyle}
                      >
                        Mint SBT <Award size={16} />
                      </button>}

                      {/* Optional Glow Overlay */}
                      {/* <span className="absolute -inset-px rounded-xl bg-gradient-to-r from-[#14a19f]/30 to-[#1ecac7]/30 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></span> */}
                    </div>

                  )) : (
                    <p className='text-gray-500 text-sm' style={robotoStyle}>No skills added yet</p>
                  )}
                </div>
              </div>
            </div>
            <div className='lg:col-span-1'>
              <div className='bg-[#1a2139] dark:bg-[#070d1a] rounded-lg p-6 border border-[#14a19f]/20 sticky top-6'>
                <div className='flex items-center gap-2 mb-6'>
                  <Award className='text-[#14a19f]' size={24} />
                  <h2 style={orbitronStyle} className='text-white text-xl font-bold tracking-wide'>Soul Bound Tokens</h2>
                </div>
                <div className='space-y-4'>
                  {sbts.length > 0 ? sbts.map((sbt) => (
                    <div
                      key={sbt.id}
                      className='dark:bg-[#0f111d] bg-[#141a2c] p-4 rounded-lg border border-[#14a19f]/30 hover:border-[#14a19f] transition-colors group'
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex-1'>
                          <h3 className='text-white font-semibold text-sm mb-1' style={robotoStyle}>{sbt.name}</h3>
                          <p className='text-gray-400 text-xs mb-2' style={robotoStyle}>Issued by {sbt.issuer}</p>
                        </div>
                        <Award className='text-[#14a19f] group-hover:scale-110 transition-transform' size={20} />
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-gray-500' style={robotoStyle}>{sbt.date}</span>
                        <span className={`text-xs px-2 py-1 rounded ${sbt.level === 'Master' ? 'bg-purple-500/20 text-purple-400' :
                          sbt.level === 'Expert' ? 'bg-blue-500/20 text-blue-400' :
                            sbt.level === 'Advanced' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                          }`} style={robotoStyle}>
                          {sbt.level}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className='text-center py-8'>
                      <Award className='text-gray-600 mx-auto mb-3' size={48} />
                      <p className='text-gray-500 text-sm' style={robotoStyle}>No SBTs earned yet. Add skills to earn certificates!</p>
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