import { useState, useEffect } from 'react'
import SideBar from '../../components/SideBar'
import { useAccount } from "wagmi";
import axios from "axios";
import "../../index.css"
import FreelancerStats from '../../components/FreelancerStats';
import BidCard from '../../components/BidCard';
import ActiveProjectCard from '../../components/ActiveProjectCard';
import CompletedProjectCard from '../../components/CompletedProjectCard';
import { AlertCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const { isConnected, address } = useAccount();
    const navigate = useNavigate();

    const [notice, setNotice] = useState(null);
    const [redNotice, setRedNotice] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');

    const [bids, setBids] = useState([]);
    const [activeProjects, setActiveProjects] = useState([]);
    const [completedProjects, setCompletedProjects] = useState([]);

    const [stats, setStats] = useState({
        totalEarnings: 0,
        activeProjects: 0,
        completedProjects: 0,
        pendingBids: 0
    });

    
    useEffect(() => {
        if (!isConnected) {
            setNotice("Wallet not connected — redirecting to home...");
            setRedNotice(true);
            const timer = setTimeout(() => {
                window.location.href = "/";
            }, 1800);
            return () => clearTimeout(timer);
        } else {
            setNotice(null);
            fetchDashboardData();
        }
    }, [isConnected, address]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/freelancer/dashboard/${address}`
            );
            
            const data = response.data || {};
            
            // Transform bid data (open jobs - not used in tabs anymore)
            const openBids = Array.isArray(data.categorized?.open) 
                ? data.categorized.open.map(bid => ({
                    id: bid._id,
                    jobId: bid.jobId,
                    jobTitle: bid.JobDetails?.title || 'Untitled Job',
                    jobDescription: bid.JobDetails?.description || '',
                    clientName: bid.JobDetails?.clientName || 'Unknown Client',
                    clientAddress: bid.JobDetails?.clientAddress,
                    bidAmount: bid.bidAmount,
                    budget: bid.JobDetails?.budget,
                    deadline: bid.JobDetails?.deadline,
                    skills: bid.JobDetails?.skills || [],
                    jobType: bid.JobDetails?.jobType || 'Fixed',
                    status: bid.status,
                    proposal: bid.proposal,
                    submittedAt: bid.createdAt
                  }))
                : [];
            
            // Transform active projects
            const inProgressProjects = Array.isArray(data.categorized?.inProgress)
                ? data.categorized.inProgress.map(project => ({
                    id: project._id,
                    jobId: project.jobId,
                    jobTitle: project.JobDetails?.title || 'Untitled Job',
                    jobDescription: project.JobDetails?.description || '',
                    clientName: project.JobDetails?.clientName || 'Unknown Client',
                    clientAddress: project.JobDetails?.clientAddress,
                    contractValue: project.bidAmount,
                    deadline: project.JobDetails?.deadline,
                    progress: project.progress || 0,
                    status: project.status,
                    milestones: project.milestones || []
                  }))
                : [];
            
            // Transform completed projects
            const completedProj = Array.isArray(data.categorized?.completed)
                ? data.categorized.completed.map(project => ({
                    id: project._id,
                    jobId: project.jobId,
                    jobTitle: project.JobDetails?.title || 'Untitled Job',
                    jobDescription: project.JobDetails?.description || '',
                    clientName: project.JobDetails?.clientName || 'Unknown Client',
                    amountEarned: project.bidAmount,
                    completedDate: project.completedDate || project.updatedAt,
                    clientRating: project.clientRating,
                    clientComment: project.clientComment,
                    daysWorked: project.daysWorked || 0,
                    deliverables: project.deliverables || 0
                  }))
                : [];
            
            setBids(openBids);
            setActiveProjects(inProgressProjects);
            setCompletedProjects(completedProj);
            
            setStats({
                totalEarnings: data.stats?.totalEarnings || 0,
                activeProjects: inProgressProjects.length,
                completedProjects: completedProj.length,
                pendingBids: openBids.length
            });
            
            setRedNotice(false);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setRedNotice(true);
            setNotice("Failed to load dashboard. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleMessageClient = (item) => {
        navigate('/messages', { state: { recipient: item.clientName || item.clientAddress } });
    };

    const handleViewContract = (project) => {
        navigate('/freelancer/contract', { state: { project } });
    };

    const handleViewDetails = (project) => {
        navigate('/freelancer/project-details', { state: { project } });
    };

    const handleLeaveReview = (project) => {
        navigate('/freelancer/add-portfolio', { state: { project } });
    };

    return (
        <>
            {/* Floating Notice */}
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

            <div className='dark:bg-[#0f111d] flex bg-[#161c32] w-full min-h-screen'>
                {/* Decorative Background Blobs */}
                <div className="pointer-events-none fixed right-[1%] bottom-[20%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen"></div>
                <div className="pointer-events-none fixed left-[5%] bottom-[1%] w-[420px] h-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen"></div>

                <SideBar />

                <div className='flex-1 p-8'>
                   
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                        <p className="text-gray-400">Manage your bids, active projects, and completed work</p>
                    </div>

                    {/* Stats Section */}
                    {!loading && (
                        <FreelancerStats stats={stats} />
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-[#14a19f]/20">
                        {[
                            { id: 'active', label: 'Active Projects', count: stats.activeProjects },
                            { id: 'completed', label: 'Completed', count: stats.completedProjects }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'text-[#14a19f] border-[#14a19f]'
                                        : 'text-gray-400 border-transparent hover:text-gray-300'
                                }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="ml-2 bg-[#14a19f]/30 text-[#14a19f] px-2 py-1 rounded text-xs font-semibold">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-gray-400">Loading dashboard...</div>
                        </div>
                    ) : (
                        <>
                            {/* Active Projects Tab */}
                            {activeTab === 'active' && (
                                <div>
                                    {activeProjects.length === 0 ? (
                                        <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-12 text-center">
                                            <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                                            <h3 className="text-lg font-semibold text-gray-300 mb-2">
                                                No active projects
                                            </h3>
                                            <p className="text-gray-400">
                                                Your accepted bids will appear here
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {activeProjects.map(project => (
                                                <ActiveProjectCard
                                                    key={project.jobId}
                                                    project={project}
                                                    onMessage={handleMessageClient}
                                                    onViewContract={handleViewContract}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Completed Projects Tab */}
                            {activeTab === 'completed' && (
                                <div>
                                    {completedProjects.length === 0 ? (
                                        <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-12 text-center">
                                            <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                                            <h3 className="text-lg font-semibold text-gray-300 mb-2">
                                                No completed projects
                                            </h3>
                                            <p className="text-gray-400">
                                                Your completed work will appear here
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {completedProjects.map(project => (
                                                <CompletedProjectCard
                                                    key={project.jobId}
                                                    project={project}
                                                    onLeaveReview={handleLeaveReview}
                                                    onViewDetails={handleViewDetails}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

export default Dashboard;