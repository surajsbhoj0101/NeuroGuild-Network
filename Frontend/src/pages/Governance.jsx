import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import SideBar from '../components/SideBar';
import { Vote, Users, Award, TrendingUp, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

export default function Governance() {
  const { isConnected, address } = useAccount();

  useEffect(() => {
    if (!isConnected) {
      window.location.href = '/';
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className='dark:bg-[#0f111d] pt-6 flex bg-[#161c32] w-full min-h-screen'>
        <div className="hidden md:block">
          <SideBar />
        </div>
        <div className='flex-1 px-6 pb-8 max-w-7xl mx-auto w-full relative z-10'>
          <div className='text-center py-20'>
            <AlertCircle className='w-16 h-16 text-[#14a19f] mx-auto mb-4' />
            <p className='text-white text-xl' style={robotoStyle}>Please connect your wallet to access Governance.</p>
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
        <SideBar />
      </div>

      <div className='flex-1 px-6 pb-8 max-w-7xl mx-auto w-full relative z-10'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-4'>
            <div className='p-3 bg-[#14a19f]/20 rounded-xl'>
              <Vote className='w-8 h-8 text-[#14a19f]' />
            </div>
            <div>
              <p style={orbitronStyle} className='text-white text-3xl tracking-widest font-extrabold mb-1'>
                Governance
              </p>
              <p className='text-gray-400' style={robotoStyle}>
                Participate in platform decisions and shape the future of NeuroGuild
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Active Proposals */}
          <div className='backdrop-blur-sm rounded-lg p-6 border border-[#14a19f]/20'>
            <div className='flex items-center gap-3 mb-6'>
              <Vote className='w-6 h-6 text-[#14a19f]' />
              <h2 style={orbitronStyle} className='text-white text-xl font-bold tracking-wide'>
                Active Proposals
              </h2>
            </div>

            <div className='space-y-4'>
              <div className='bg-gray-800/50 rounded-lg p-4 border border-gray-700/50'>
                <div className='flex justify-between items-start mb-3'>
                  <h3 className='text-white font-semibold' style={robotoStyle}>Update Skill Assessment Criteria</h3>
                  <span className='px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30'>
                    Active
                  </span>
                </div>
                <p className='text-gray-400 text-sm mb-3' style={robotoStyle}>
                  Modify the criteria used for evaluating skill proficiency levels
                </p>
                <div className='flex justify-between text-sm text-gray-400'>
                  <span>Votes: 234/500</span>
                  <span>Ends: Feb 15, 2026</span>
                </div>
              </div>

              <div className='bg-gray-800/50 rounded-lg p-4 border border-gray-700/50'>
                <div className='flex justify-between items-start mb-3'>
                  <h3 className='text-white font-semibold' style={robotoStyle}>Modify Council Voting Power</h3>
                  <span className='px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30'>
                    Active
                  </span>
                </div>
                <p className='text-gray-400 text-sm mb-3' style={robotoStyle}>
                  Adjust voting power distribution among council members
                </p>
                <div className='flex justify-between text-sm text-gray-400'>
                  <span>Votes: 189/500</span>
                  <span>Ends: Feb 20, 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Your Voting Status */}
          <div className='backdrop-blur-sm rounded-lg p-6 border border-[#14a19f]/20'>
            <div className='flex items-center gap-3 mb-6'>
              <Users className='w-6 h-6 text-[#14a19f]' />
              <h2 style={orbitronStyle} className='text-white text-xl font-bold tracking-wide'>
                Your Voting Status
              </h2>
            </div>

            <div className='space-y-4'>
              <div className='bg-green-500/10 rounded-lg p-4 border border-green-500/20'>
                <div className='flex items-center gap-3 mb-2'>
                  <CheckCircle className='w-5 h-5 text-green-400' />
                  <span className='text-green-400 font-medium' style={robotoStyle}>Eligible to Vote</span>
                </div>
                <p className='text-gray-300 text-sm' style={robotoStyle}>
                  You have voting rights as a verified platform member with SBTs.
                </p>
              </div>

              <div className='bg-gray-800/50 rounded-lg p-4 border border-gray-700/50'>
                <h3 className='text-white font-semibold mb-2' style={robotoStyle}>Recent Activity</h3>
                <div className='space-y-2'>
                  <div className='flex justify-between items-center text-sm'>
                    <span className='text-gray-400'>Voted on Proposal #001</span>
                    <span className='text-green-400'>Approved</span>
                  </div>
                  <div className='flex justify-between items-center text-sm'>
                    <span className='text-gray-400'>Voted on Proposal #002</span>
                    <span className='text-red-400'>Rejected</span>
                  </div>
                </div>
              </div>

              <div className='bg-gray-800/50 rounded-lg p-4 border border-gray-700/50'>
                <h3 className='text-white font-semibold mb-3' style={robotoStyle}>Quick Actions</h3>
                <div className='space-y-2'>
                  <button className='w-full px-4 py-2 bg-[#14a19f] hover:bg-[#1ecac7] text-white rounded transition-colors text-sm font-medium'>
                    Create Proposal
                  </button>
                  <button className='w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors text-sm font-medium'>
                    View All Proposals
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className='mt-8 backdrop-blur-sm rounded-lg p-6 border border-[#14a19f]/20'>
          <div className='flex items-center gap-3 mb-6'>
            <TrendingUp className='w-6 h-6 text-[#14a19f]' />
            <h2 style={orbitronStyle} className='text-white text-xl font-bold tracking-wide'>
              Platform Statistics
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-white mb-1' style={orbitronStyle}>12</div>
              <div className='text-gray-400 text-sm' style={robotoStyle}>Active Proposals</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-white mb-1' style={orbitronStyle}>1,247</div>
              <div className='text-gray-400 text-sm' style={robotoStyle}>Total Voters</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-white mb-1' style={orbitronStyle}>3,492</div>
              <div className='text-gray-400 text-sm' style={robotoStyle}>SBTs Issued</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-white mb-1' style={orbitronStyle}>67%</div>
              <div className='text-gray-400 text-sm' style={robotoStyle}>Participation Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}