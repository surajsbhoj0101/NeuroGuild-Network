import React from 'react';
import { Star, DollarSign, Calendar, Award } from 'lucide-react';

function CompletedProjectCard({ project, onLeaveReview, onViewDetails }) {
  const ratingColor = project?.clientRating >= 4.5 ? 'text-yellow-400' : project?.clientRating >= 3 ? 'text-orange-400' : 'text-red-400';

  return (
    <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-5 hover:border-[#14a19f]/50 transition-all duration-200 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white line-clamp-2 mb-2">
            {project?.jobTitle || 'Untitled Job'}
          </h3>
          <p className="text-sm text-gray-300 mb-1">
            Client: <span className="font-medium">{project?.clientName || 'Unknown'}</span>
          </p>
        </div>
        <div className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-medium">
          ✓ Completed
        </div>
      </div>

      {/* Amount & Dates */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#14a19f]/10 rounded p-2">
          <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <DollarSign size={12} />
            Earned
          </p>
          <p className="text-lg font-bold text-[#14a19f]">${project?.amountEarned || '0'}</p>
        </div>
        <div className="bg-[#14a19f]/10 rounded p-2">
          <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <Calendar size={12} />
            Completed
          </p>
          <p className="text-white font-semibold">
            {project?.completedDate ? new Date(project.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Client Rating */}
      {/* Client Rating */}
      {project?.clientRating && (
        <div className="bg-linear-to-r from-[#14a19f]/10 to-purple-500/10 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">Client Rating</p>
            <p className="text-sm text-gray-200">
              {project?.clientComment && `"${project.clientComment}"`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.floor(project?.clientRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
                />
              ))}
            </div>
            <span className={`font-bold ml-2 ${ratingColor}`}>
              {(project?.clientRating || 0).toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-300 line-clamp-3 bg-[#161c32]/50 rounded p-3">
        {project?.jobDescription || 'No description'}
      </p>

      {/* Stats */}
      <div className="flex gap-3 text-xs text-gray-400">
        {project?.daysWorked && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {project.daysWorked} days
          </span>
        )}
        {project?.deliverables && (
          <span className="flex items-center gap-1">
            <Award size={12} />
            {project.deliverables} deliverables
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onViewDetails?.(project)}
          className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-sm font-medium py-2 rounded transition-colors"
        >
          View Details
        </button>
        {!project?.clientRating && (
          <button
            onClick={() => onLeaveReview?.(project)}
            className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
          >
            <Star size={16} />
            Add Portfolio
          </button>
        )}
      </div>
    </div>
  );
}

export default CompletedProjectCard;
