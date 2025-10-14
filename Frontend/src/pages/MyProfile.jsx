import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import SideBar from '../components/SideBar';
import { Award, Plus, X, Check, User, Briefcase, Mail, MapPin, Github, Linkedin, Twitter, Globe } from 'lucide-react';

const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

export default function MyProfile() {
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);

  // Profile data
  const [profile, setProfile] = useState({
    displayName: '',
    bio: '',
    title: '',
    location: '',
    email: '',
    github: '',
    linkedin: '',
    twitter: '',
    website: '',
    hourlyRate: '',
    experience: '',
    availability: 'available',
    avatarUrl: '' // Added for profile picture
  });

  const [skills, setSkills] = useState([]);
  const [sbts, setSbts] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    let t;
    if (!isConnected) {
      setNotice("Wallet not connected — redirecting to home...");
      t = setTimeout(() => navigate('/'), 1600);
    } else {
      setNotice(null);
      // Load profile data from memory (in real app, this would be from blockchain/IPFS)
      loadProfileData();
    }
    return () => clearTimeout(t);
  }, [isConnected, navigate, address]);

  const loadProfileData = () => {
    // Simulate loading data
    const savedProfile = {
      displayName: 'Jane Developer',
      bio: 'Full-stack blockchain developer passionate about Web3',
      title: 'Senior Blockchain Developer',
      location: 'Remote',
      email: 'jane@example.com',
      github: 'janedev',
      linkedin: 'janedev',
      twitter: 'janedev',
      website: 'janedev.eth',
      hourlyRate: '75',
      experience: '5+ years',
      availability: 'available',
      // Use a fun, deterministic avatar based on the wallet address
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${address || 'placeholder'}`
    };

    const savedSkills = ['Solidity', 'React', 'Web3.js'];
    const savedSbts = [
      { id: 1, name: 'Solidity Expert', issuer: 'ChainSkill DAO', date: '2024-01-15', level: 'Expert' },
      { id: 2, name: 'React Developer', issuer: 'DevCert Protocol', date: '2024-02-20', level: 'Advanced' },
      { id: 3, name: 'Web3.js Master', issuer: 'Ethereum Foundation', date: '2024-03-10', level: 'Master' }
    ];

    setProfile(savedProfile);
    setSkills(savedSkills);
    setSbts(savedSbts);
  };

  const calculateProfileCompletion = () => {
    const fields = [
      profile.avatarUrl, // Added for completion calculation
      profile.displayName,
      profile.bio,
      profile.title,
      profile.location,
      profile.email,
      profile.hourlyRate,
      profile.experience,
      skills.length > 0,
      profile.github || profile.linkedin || profile.twitter || profile.website
    ];

    const completed = fields.filter(field => field && field !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const skill = newSkill.trim();
      setSkills([...skills, skill]);

      // Simulate SBT minting
      const newSbt = {
        id: Date.now(),
        name: `${skill} Certification`,
        issuer: 'SkillChain Protocol',
        date: new Date().toISOString().split('T')[0],
        level: 'Beginner'
      };
      setSbts([...sbts, newSbt]);

      setNewSkill('');
      setShowSkillInput(false);
      setNotice(`Skill added! SBT minted for ${skill}`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleInputChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const completion = calculateProfileCompletion();

  return (
    <>
      {/* Floating notice */}
      {notice && (
        <div className="fixed top-4 right-4 z-50 animate-pulse">
          <div className="flex items-center gap-3 bg-[#14a19f] text-white px-4 py-2 rounded shadow-lg border border-[#1ecac7]/30">
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
        {/* Background Gradient Orbs */}
        <div className="pointer-events-none absolute right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
        <div className="pointer-events-none absolute left-[20%] top-[1%] w-[120px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
        <div className="hidden md:block">
          <SideBar />
        </div>

        <div className='flex-1 px-6 pb-8 max-w-7xl mx-auto w-full relative z-10'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex justify-between items-center'>
              <p style={orbitronStyle} className='text-white text-3xl tracking-widest font-extrabold mb-1'>
                My Profile
              </p>
              <button
                onClick={() => setEditMode(!editMode)}
                className='px-4 py-2 bg-[#14a19f] hover:bg-[#1ecac7] text-white rounded transition-colors text-sm'
                style={robotoStyle}
              >
                {editMode ? 'Save Profile' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Profile Completion Bar */}
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
            {/* Main Profile Section */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Basic Info */}
              <div className='bg-[#1a2139] dark:bg-[#070d1a] rounded-lg p-6 border border-[#14a19f]/20'>
                <h2 style={orbitronStyle} className='text-white text-xl font-bold mb-4 tracking-wide'>
                  Basic Information
                </h2>

                <div className='space-y-4'>
                  {/* --- AVATAR & NAME SECTION --- */}
                  <div className='flex flex-col sm:flex-row-reverse items-center gap-6'>
                    {/* Avatar Display */}
                    <div className='flex-shrink-0'>
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt="Profile Avatar"
                          className='w-24 h-24 rounded-full object-cover border-2 border-[#14a19f]'
                        />
                      ) : (
                        <div className='w-24 h-24 rounded-full bg-[#0f111d] border-2 border-[#14a19f]/50 flex items-center justify-center'>
                          <User size={40} className='text-gray-500' />
                        </div>
                      )}
                    </div>

                    {/* Name and Title Fields */}
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

                  {/* Avatar URL Input (only in edit mode) */}
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
                  {/* --- END AVATAR & NAME SECTION --- */}

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

              {/* Professional Info */}
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

              {/* Social Links */}
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
                    <label className='text-gray-400 text-sm mb-2 block  items-center gap-2' style={robotoStyle}><Twitter size={16} /> Twitter Username</label>
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

              {/* Skills Section */}
              <div className='bg-[#1a2139] dark:bg-[#070d1a] rounded-lg p-6 border border-[#14a19f]/20'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 style={orbitronStyle} className='text-white text-xl font-bold tracking-wide'>Skills</h2>
                  <button
                    onClick={() => setShowSkillInput(true)}
                    className='flex items-center gap-2 px-3 py-2 bg-[#14a19f] hover:bg-[#1ecac7] text-white rounded transition-colors text-sm'
                    style={robotoStyle}
                  ><Plus size={16} /> Add Skill</button>
                </div>
                {showSkillInput && (
                  <div className='mb-4 flex gap-2'>
                    <input
                      type='text'
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onClick={(e) => e.key === 'Enter' && addSkill()}
                      placeholder='Enter skill name'
                      className='flex-1 bg-[#0f111d] text-white px-4 py-2 rounded border border-[#14a19f]/30 focus:border-[#14a19f] outline-none'
                      style={robotoStyle}
                      autoFocus
                    />
                    <button onClick={addSkill} className='px-4 py-2 bg-[#14a19f] hover:bg-[#1ecac7] text-white rounded transition-colors'><Check size={20} /></button>
                    <button onClick={() => { setShowSkillInput(false); setNewSkill(''); }} className='px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors'><X size={20} /></button>
                  </div>
                )}
                <div className='flex flex-wrap gap-2'>
                  {skills.length > 0 ? skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className='group relative px-4 py-2 bg-[#14a19f]/20 border border-[#14a19f]/50 text-[#14a19f] rounded-full text-sm flex items-center gap-2 hover:bg-[#14a19f]/30 transition-colors'
                      style={robotoStyle}
                    >
                      {skill}
                      <button onClick={() => removeSkill(skill)} className='opacity-0 group-hover:opacity-100 transition-opacity'><X size={14} /></button>
                    </div>
                  )) : (
                    <p className='text-gray-500 text-sm' style={robotoStyle}>No skills added yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - SBTs */}
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