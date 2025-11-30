import React from 'react';
import { Edit2, Trash2, Eye, Users, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

function JobCard({ job, onEdit, onDelete, onViewBids, onMarkComplete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'closed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'draft':
        return <AlertCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const isOverdue = new Date(job.deadline) < new Date() && job.status === 'active';

  return (
    <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-5 hover:border-[#14a19f]/50 transition-all duration-200 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white line-clamp-2 mb-2">
            {job.title}
          </h3>
          <p className="text-sm text-gray-300 line-clamp-2">
            {job.description}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getStatusColor(job.status)}`}>
          {getStatusIcon(job.status)}
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-2">
        {job.skills?.slice(0, 3).map((skill, idx) => (
          <span key={idx} className="text-xs bg-[#1be4e0]/20 text-[#14a19f] px-2 py-1 rounded">
            {skill}
          </span>
        ))}
        {job.skills?.length > 3 && (
          <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
            +{job.skills.length - 3}
          </span>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-[#14a19f]/10 rounded p-2">
          <p className="text-gray-400 text-xs mb-1">Budget</p>
          <p className="text-white font-semibold flex items-center gap-1">
            <DollarSign size={14} />
            {job.budget}
          </p>
        </div>
        <div className="bg-[#14a19f]/10 rounded p-2">
          <p className="text-gray-400 text-xs mb-1">Bids</p>
          <p className="text-white font-semibold flex items-center gap-1">
            <Users size={14} />
            {job.bidCount || 0}
          </p>
        </div>
        <div className={`rounded p-2 ${isOverdue ? 'bg-red-500/10' : 'bg-[#14a19f]/10'}`}>
          <p className="text-gray-400 text-xs mb-1">Deadline</p>
          <p className={`font-semibold flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-white'}`}>
            <Clock size={14} />
            {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onViewBids(job)}
          className="flex-1 bg-[#14a19f]/20 hover:bg-[#14a19f]/30 text-[#14a19f] border border-[#14a19f]/30 text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
        >
          <Eye size={16} />
          View Bids
        </button>
        {job.status !== 'completed' && (
          <button
            onClick={() => onEdit(job)}
            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
          >
            <Edit2 size={16} />
            Edit
          </button>
        )}
        {job.status === 'active' && (
          <button
            onClick={() => onMarkComplete(job)}
            className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Complete
          </button>
        )}
        <button
          onClick={() => onDelete(job)}
          className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      {/* Overdue warning */}
      {isOverdue && (
        <div className="bg-red-500/10 border border-red-500/30 rounded p-2 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">This job deadline has passed</p>
        </div>
      )}
    </div>
  );
}

export default JobCard;
