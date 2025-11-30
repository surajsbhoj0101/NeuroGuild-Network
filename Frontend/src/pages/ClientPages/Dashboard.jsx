import { useState, useEffect } from 'react'
import SideBar from '../../components/SideBar'
import { useAccount } from "wagmi";
import axios from "axios";
import "../../index.css"
import JobCard from '../../components/JobCard';
import JobFilters from '../../components/JobFilters';
import JobStats from '../../components/JobStats';
import BidsModal from '../../components/BidsModal';
import { Plus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


function Dashboard() {
    const { isConnected, address } = useAccount();
    const navigate = useNavigate();

    const [notice, setNotice] = useState(null);
    const [redNotice, setRedNotice] = useState(false);
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [selectedJobForBids, setSelectedJobForBids] = useState(null);
    const [jobBids, setJobBids] = useState([]);
    const [deletingJobId, setDeletingJobId] = useState(null);

    const [filters, setFilters] = useState({
        status: ['active', 'draft'],
        search: '',
        sortBy: 'recent'
    });

    // Fetch jobs on component mount or address change
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
            fetchClientJobs();
        }
    }, [isConnected, address]);

    const fetchClientJobs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/jobs/client-jobs/${address}`
            );
            setJobs(response.data?.jobs || []);
            setRedNotice(false);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setRedNotice(true);
            setNotice("Failed to load jobs. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchJobBids = async (job) => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/jobs/${job.id}/bids`
            );
            setJobBids(response.data?.bids || []);
            setSelectedJobForBids(job);
        } catch (error) {
            console.error("Error fetching bids:", error);
            setRedNotice(true);
            setNotice("Failed to load bids");
        }
    };

    const handleDeleteJob = async (job) => {
        if (!window.confirm(`Are you sure you want to delete "${job.title}"?`)) return;

        setDeletingJobId(job.id);
        try {
            await axios.delete(
                `http://localhost:5000/api/jobs/${job.id}`,
                { data: { clientAddress: address } }
            );
            setJobs(jobs.filter(j => j.id !== job.id));
            setNotice("Job deleted successfully");
            setRedNotice(false);
        } catch (error) {
            console.error("Error deleting job:", error);
            setRedNotice(true);
            setNotice("Failed to delete job");
        } finally {
            setDeletingJobId(null);
        }
    };

    const handleEditJob = (job) => {
        navigate('/client/post-job', { state: { jobToEdit: job } });
    };

    const handleMarkComplete = async (job) => {
        if (!window.confirm(`Mark "${job.title}" as completed?`)) return;

        try {
            await axios.put(
                `http://localhost:5000/api/jobs/${job.id}/complete`,
                { clientAddress: address }
            );
            setJobs(jobs.map(j => 
                j.id === job.id ? { ...j, status: 'completed' } : j
            ));
            setNotice("Job marked as completed");
            setRedNotice(false);
        } catch (error) {
            console.error("Error marking job complete:", error);
            setRedNotice(true);
            setNotice("Failed to complete job");
        }
    };

    const handleAcceptBid = async (bid) => {
        if (!window.confirm(`Accept bid from ${bid.freelancerName}?`)) return;

        try {
            await axios.post(
                `http://localhost:5000/api/jobs/accept-bid`,
                { 
                    bidId: bid.id,
                    jobId: selectedJobForBids.id,
                    clientAddress: address
                }
            );
            setJobBids(jobBids.map(b => 
                b.id === bid.id ? { ...b, status: 'accepted' } : { ...b, status: 'rejected' }
            ));
            setNotice("Bid accepted successfully");
            setRedNotice(false);
        } catch (error) {
            console.error("Error accepting bid:", error);
            setRedNotice(true);
            setNotice("Failed to accept bid");
        }
    };

    const handleRejectBid = async (bid) => {
        if (!window.confirm(`Reject bid from ${bid.freelancerName}?`)) return;

        try {
            await axios.post(
                `http://localhost:5000/api/jobs/reject-bid`,
                { 
                    bidId: bid.id,
                    jobId: selectedJobForBids.id,
                    clientAddress: address
                }
            );
            setJobBids(jobBids.map(b => 
                b.id === bid.id ? { ...b, status: 'rejected' } : b
            ));
            setNotice("Bid rejected");
            setRedNotice(false);
        } catch (error) {
            console.error("Error rejecting bid:", error);
            setRedNotice(true);
            setNotice("Failed to reject bid");
        }
    };

    // Filter and sort jobs
    const getFilteredAndSortedJobs = () => {
        let filtered = jobs.filter(job => {
            // Filter by status
            if (!filters.status.includes(job.status)) return false;
            
            // Filter by search
            if (filters.search) {
                const search = filters.search.toLowerCase();
                return (
                    job.title?.toLowerCase().includes(search) ||
                    job.description?.toLowerCase().includes(search) ||
                    job.skills?.some(s => s.toLowerCase().includes(search))
                );
            }
            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            switch (filters.sortBy) {
                case 'budget-high':
                    return parseFloat(b.budget || 0) - parseFloat(a.budget || 0);
                case 'budget-low':
                    return parseFloat(a.budget || 0) - parseFloat(b.budget || 0);
                case 'deadline-soon':
                    return new Date(a.deadline) - new Date(b.deadline);
                case 'bids-high':
                    return (b.bidCount || 0) - (a.bidCount || 0);
                case 'recent':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return filtered;
    };

    const filteredJobs = getFilteredAndSortedJobs();

    return (
        <>
            {/* Floating Notice */}
            {notice && (
                <div className="fixed top-4 right-4 z-50 animate-pulse">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                        redNotice 
                            ? 'bg-red-600/20 border-red-500/30 text-red-300' 
                            : 'bg-green-600/20 border-green-500/30 text-green-300'
                    }`}>
                        <AlertCircle size={18} />
                        <div className="text-sm">{notice}</div>
                        <button
                            onClick={() => setNotice(null)}
                            className="ml-2 text-xs px-2 py-1 rounded hover:opacity-75 transition-opacity"
                        >
                            ✕
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
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-3xl font-bold text-white">Job Management</h1>
                            <button
                                onClick={() => navigate('/client/post-job')}
                                className="flex items-center gap-2 bg-[#14a19f] hover:bg-[#14a19f]/90 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:shadow-lg"
                            >
                                <Plus size={20} />
                                Post New Job
                            </button>
                        </div>
                        <p className="text-gray-400">View and manage all your posted jobs</p>
                    </div>

                    {/* Stats Section */}
                    {!loading && jobs.length > 0 && (
                        <JobStats jobs={jobs} />
                    )}

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Filters Sidebar */}
                        <div className="lg:col-span-1">
                            <JobFilters 
                                filters={filters} 
                                setFilters={setFilters}
                                statusOptions={['active', 'draft', 'completed', 'closed']}
                            />
                        </div>

                        {/* Jobs Grid */}
                        <div className="lg:col-span-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-gray-400">Loading jobs...</div>
                                </div>
                            ) : filteredJobs.length === 0 ? (
                                <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-12 text-center">
                                    <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                                    <h3 className="text-lg font-semibold text-gray-300 mb-2">
                                        {jobs.length === 0 ? 'No jobs posted yet' : 'No matching jobs'}
                                    </h3>
                                    <p className="text-gray-400 mb-6">
                                        {jobs.length === 0 
                                            ? 'Start by creating your first job posting'
                                            : 'Try adjusting your filters'}
                                    </p>
                                    {jobs.length === 0 && (
                                        <button
                                            onClick={() => navigate('/client/post-job')}
                                            className="bg-[#14a19f] hover:bg-[#14a19f]/90 text-white font-semibold px-6 py-2 rounded-lg transition-all inline-flex items-center gap-2"
                                        >
                                            <Plus size={18} />
                                            Post Your First Job
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredJobs.map(job => (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            onEdit={handleEditJob}
                                            onDelete={handleDeleteJob}
                                            onViewBids={fetchJobBids}
                                            onMarkComplete={handleMarkComplete}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bids Modal */}
            {selectedJobForBids && (
                <BidsModal
                    job={selectedJobForBids}
                    bids={jobBids}
                    onClose={() => {
                        setSelectedJobForBids(null);
                        setJobBids([]);
                    }}
                    onAcceptBid={handleAcceptBid}
                    onRejectBid={handleRejectBid}
                />
            )}
        </>
    )
}

export default Dashboard
