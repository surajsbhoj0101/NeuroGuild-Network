import React, { useState } from 'react';
import { X, User, DollarSign, MessageSquare, CheckCircle } from 'lucide-react';

function BidsModal({ job, bids, onClose, onAcceptBid, onRejectBid }) {
  const [selectedBidId, setSelectedBidId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  if (!job) return null;

  const filteredBids = filterStatus === 'all' 
    ? bids 
    : bids.filter(bid => bid.status === filterStatus);

  const acceptedBid = bids.find(b => b.status === 'accepted');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#0d1224] border border-[#14a19f]/30 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0d1224] border-b border-[#14a19f]/20 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">{job.title}</h2>
            <p className="text-sm text-gray-400">{bids.length} bids received</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#14a19f]/20 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="sticky top-16 bg-[#0d1224]/80 border-b border-[#14a19f]/20 p-4 flex gap-2">
          {['all', 'pending', 'accepted', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                filterStatus === status
                  ? 'bg-[#14a19f] text-white'
                  : 'bg-[#14a19f]/20 text-gray-300 hover:bg-[#14a19f]/30'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Bids List */}
        <div className="p-6 space-y-4">
          {filteredBids.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No bids in this category</p>
            </div>
          ) : (
            filteredBids.map(bid => (
              <div
                key={bid.id}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${
                  selectedBidId === bid.id
                    ? 'border-[#14a19f] bg-[#14a19f]/10'
                    : 'border-[#14a19f]/20 bg-[#0d1224]/30 hover:border-[#14a19f]/40'
                }`}
                onClick={() => setSelectedBidId(selectedBidId === bid.id ? null : bid.id)}
              >
                {/* Bid Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={bid?.FreelancerDetails?.BasicInformation?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${bid.bidderAddress}`}
                      alt={bid?.FreelancerDetails?.BasicInformation?.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-white font-semibold">{bid?.FreelancerDetails?.BasicInformation?.name}</p>
                      <p className="text-xs text-gray-400">{bid.bid?.FreelancerDetails?.BasicInformation?.title|| 'Freelancer'}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-xs font-medium ${
                    bid.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                    bid.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                  </div>
                </div>

                {/* Bid Amount */}
                <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-[#14a19f]">
                  <DollarSign size={18} />
                  {bid.bidAmount.toLocaleString()}
                </div>

                {/* Bid Proposal - Expandable */}
                {selectedBidId === bid.id && (
                  <div className="mb-4 bg-[#161c32] rounded p-3">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <MessageSquare size={14} />
                      Proposal
                    </p>
                    <p className="text-sm text-gray-200 leading-relaxed">
                      {bid.proposal}
                    </p>
                  </div>
                )}

                {/* Bid Info */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                  <span>Submitted: {new Date(bid?.timestamp).toLocaleDateString()}</span>
                 
                  {/* {bid.completedProjects && <span>Completed: {bid.completedProjects}</span>} */}
                </div>

                {/* Actions */}
                {bid.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptBid(bid);
                      }}
                      className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRejectBid(bid);
                      }}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-sm font-medium py-2 rounded transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {acceptedBid && bid.id === acceptedBid.id && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-xs text-green-400 text-center">
                    ✓ This bid has been accepted for this job
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BidsModal;
