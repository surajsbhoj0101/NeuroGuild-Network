import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import SideBar from '../../components/SideBar';
import api from "../../utils/api.js"
import { Github, Linkedin, ArrowRight, Award, Brain, Users, Star, CheckCircle, AlertCircle, Info } from 'lucide-react';

const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

export default function MintRules() {
  const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
  const [skill, setSkill] = useState();
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();
  const [connectedPlatform, setConnectedPlatform] = useState(null);
  const [connectedInfo, setConnectedInfo] = useState({
    username: "",
    avatarUrl: ""
  })

  const rules = [
    "You must have verifiable experience in the selected skill.",
    "The test will assess your knowledge and proficiency level.",
    "Connecting your LinkedIn or GitHub profile helps verify your background and it's mandatory",
    "Upon passing, you will receive a Soul Bound Token (SBT) for this skill.",
    "SBTs are non-transferable and represent your verified expertise.",
    "You can only attempt the test once per skill in 72 hours.",
    "Ensure your wallet is connected before proceeding."
  ];

  const scoringInfo = {
    ai: {
      title: "AI Assessment (100 points)",
      description: "Automated evaluation of your test performance, code quality, and problem-solving approach.",
      icon: Brain,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30"
    },
    council: {
      title: "Council Review (100 points)",
      description: "Expert human reviewers evaluate your overall proficiency, real-world application, and skill mastery.",
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30"
    },
    decision: {
      title: "Final Decision",
      description: "Only the council decides if you receive an SBT and determines your skill level (Beginner/Intermediate/Advanced).",
      icon: Award,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30"
    }
  };

  const levels = [
    { name: "Advanced", threshold: "160+", color: "text-purple-400", icon: Star },
    { name: "Intermediate", threshold: "80-160", color: "text-blue-400", icon: Award },
    { name: "Beginner", threshold: "<80", color: "text-green-400", icon: CheckCircle }
  ];

  function handleGithubOAuth() {
    window.location.href = "http://localhost:5000/api/auth/github";
  }



  async function checkSkillData() {
    try {
      const res = await api.get(
        "http://localhost:5000/api/auth/check-skill-data",
        { withCredentials: true }
      );

      if (!res.data?.skill) {
        navigate("/");
        return;
      }

      setSkill(res.data.skill);
    } catch (error) {
      navigate("/");
    }
  }

  async function getUserGitAuthData() {
    try {
      const res = await api.get('http://localhost:5000/api/auth/github-auth-user');
      const data = res.data.data;
      console.log(data.githubUser)
      setConnectedInfo({
        username: data?.githubUser.name,
        avatarUrl: data?.githubUser.avatar_url
      })
      setConnectedPlatform('github')
    } catch (error) {

    }
  }

  useEffect(() => {
    checkSkillData();
    getUserGitAuthData()
  }, []);



  const handleConnect = (platform) => {
    if (platform === 'github') {
      handleGithubOAuth();
      setConnectedPlatform(platform);
    } else {

    }
    // Here you would implement the actual OAuth connection
    // For now, just set the connected platform and proceed

    // In a real implementation, this would redirect to OAuth and handle the callback

  };

  const proceedToTest = () => {
    if (connectedPlatform) {
      navigate(`/verify-skill/${skill}`);
    }
  };

  if (!isConnected) {
    return (
      <div className='dark:bg-[#0f111d] pt-6 flex bg-[#161c32] w-full min-h-screen'>
        <div className="hidden md:block">
          {/* <SideBar /> */}
        </div>
        <div className='flex-1 px-6 pb-8 max-w-7xl mx-auto w-full relative z-10'>
          <div className='text-center py-20'>
            <div className='mb-6'>
              <AlertCircle className='w-16 h-16 text-[#14a19f] mx-auto mb-4' />
            </div>
            <p className='text-white text-xl mb-2' style={robotoStyle}>Wallet Not Connected</p>
            <p className='text-gray-400' style={robotoStyle}>Please connect your wallet to proceed with SBT minting.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='dark:bg-[#0f111d] pt-6 flex bg-[#161c32] w-full min-h-screen'>
      <div className="pointer-events-none absolute right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
      <div className="pointer-events-none absolute left-[20%] top-[1%] w-[120px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>
      <div className="hidden md:block">
        {/* <SideBar /> */}
      </div>

      <div className='flex-1 px-6 pb-8 max-w-6xl mx-auto w-full relative z-10'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-4'>
            <div className='p-3 bg-[#14a19f]/20 rounded-xl'>
              <Award className='w-8 h-8 text-[#14a19f]' />
            </div>
            <div>
              <p style={orbitronStyle} className='text-white text-3xl tracking-widest font-extrabold mb-1'>
                Mint SBT for {skill}
              </p>
              <p className='text-gray-400' style={robotoStyle}>
                Review the rules and connect your profile before starting the verification test.
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
          {/* Rules Section */}
          <div className='xl:col-span-1'>
            <div className='backdrop-blur-sm rounded-xl p-6 border border-[#14a19f]/20 h-fit'>
              <div className='flex items-center gap-3 mb-6'>
                <Info className='w-6 h-6 text-[#14a19f]' />
                <h2 style={orbitronStyle} className='text-white text-xl font-bold tracking-wide'>
                  Rules & Guidelines
                </h2>
              </div>
              <ul className='space-y-4'>
                {rules.map((rule, index) => (
                  <li key={index} className='flex items-start gap-3'>
                    <div className='w-2 h-2 bg-[#14a19f] rounded-full mt-2 flex-shrink-0'></div>
                    <p className='text-gray-300 text-sm leading-relaxed' style={robotoStyle}>{rule}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Scoring System */}
          <div className='xl:col-span-2 space-y-6'>
            <div className='backdrop-blur-sm rounded-xl p-6 border border-[#14a19f]/20'>
              <div className='flex items-center gap-3 mb-6'>
                <Star className='w-6 h-6 text-[#14a19f]' />
                <h2 style={orbitronStyle} className='text-white text-xl font-bold tracking-wide'>
                  Scoring System
                </h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                {Object.entries(scoringInfo).map(([key, info]) => {
                  const IconComponent = info.icon;
                  return (
                    <div key={key} className={`p-4 rounded-lg border ${info.bgColor} ${info.borderColor}`}>
                      <div className='flex items-center gap-3 mb-3'>
                        <IconComponent className={`w-5 h-5 ${info.color}`} />
                        <h3 className={`font-semibold text-sm ${info.color}`} style={robotoStyle}>
                          {info.title}
                        </h3>
                      </div>
                      <p className='text-gray-300 text-xs leading-relaxed' style={robotoStyle}>
                        {info.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className='border-t border-gray-700 pt-6'>
                <h3 className='text-white font-semibold mb-4 flex items-center gap-2' style={robotoStyle}>
                  <Award className='w-5 h-5 text-[#14a19f]' />
                  Skill Levels
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  {levels.map((level, index) => {
                    const IconComponent = level.icon;
                    return (
                      <div key={index} className='flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700'>
                        <IconComponent className={`w-5 h-5 ${level.color}`} />
                        <div>
                          <p className={`font-medium text-sm ${level.color}`} style={robotoStyle}>
                            {level.name}
                          </p>
                          <p className='text-gray-400 text-xs' style={robotoStyle}>
                            {level.threshold} points
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Connect Profile Section */}
            <div className='backdrop-blur-sm rounded-xl p-6 border border-[#14a19f]/20'>
              <div className='flex items-center gap-3 mb-6'>
                <Users className='w-6 h-6 text-[#14a19f]' />
                <h2 style={orbitronStyle} className='text-white text-xl font-bold tracking-wide'>
                  Connect Profile
                </h2>
              </div>
              <p className='text-gray-400 text-sm mb-6' style={robotoStyle}>
                Choose a platform to connect and verify your background for this skill. This step is mandatory.
              </p>

              <div className="space-y-4">

                {/* ---------- GitHub ---------- */}
                <button
                  onClick={() => connectedPlatform !== 'github' && handleConnect('github')}
                  disabled={connectedPlatform !== null}
                  className={`w-full rounded-xl transition-all duration-300 ${connectedPlatform === 'github'
                    ? 'cursor-default'
                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-[#14a19f] hover:shadow-lg'
                    }`}
                  style={robotoStyle}
                >
                  {connectedPlatform === 'github' ? (
                    <div className="flex items-center gap-4 px-3 py-1.5 bg-transparent border-gray-600 rounded-xl border shadow-sm">
                      <img
                        src={connectedInfo?.avatarUrl}
                        alt="GitHub avatar"
                        className="h-14 w-14 rounded-full border border-amber-50"
                      />

                      <div className="flex flex-col text-left">
                        <span className="text-sm text-white">
                          Connected to GitHub
                        </span>
                        <span className="text-lg font-semibold text-white">
                          {connectedInfo?.username}
                        </span>
                      </div>

                      <div className="ml-auto">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Connected
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 p-4 text-gray-300">
                      <span className="text-base font-medium">Connect GitHub</span>
                    </div>
                  )}
                </button>

                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed"
                  style={robotoStyle}
                >
                  <Linkedin size={20} />
                  <span className="text-base font-medium">
                    Connect LinkedIn (Coming Soon)
                  </span>
                </button>

              </div>


              {connectedPlatform && (
                <div className='mt-6 pt-6 border-t border-gray-700'>
                  <button
                    onClick={proceedToTest}
                    className='w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#14a19f] to-[#1ecac7] hover:shadow-lg hover:shadow-[#14a19f]/25 text-white rounded-lg transition-all duration-300 font-semibold'
                    style={robotoStyle}
                  >
                    Proceed to Test <ArrowRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}