import React from 'react';
import { Search, Filter, X } from 'lucide-react';

function JobFilters({ filters, setFilters, statusOptions }) {
  const handleStatusChange = (status) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };

  const handleSortChange = (e) => {
    setFilters(prev => ({
      ...prev,
      sortBy: e.target.value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: ['active', 'draft'],
      search: '',
      sortBy: 'recent'
    });
  };

  const hasActiveFilters = filters.search || filters.status.length < 2;

  return (
    <div className="backdrop-blur-md border border-[#14a19f]/20 bg-[#0d1224]/50 rounded-xl p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search jobs..."
          value={filters.search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 bg-[#161c32] border border-[#14a19f]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#14a19f]/50 transition-colors"
        />
      </div>

      {/* Status Filters */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Status</h4>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(status => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                filters.status.includes(status)
                  ? 'bg-[#14a19f] text-white'
                  : 'bg-[#14a19f]/20 text-gray-300 hover:bg-[#14a19f]/30'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Sort By</h4>
        <select
          value={filters.sortBy}
          onChange={handleSortChange}
          className="w-full px-3 py-2 bg-[#161c32] border border-[#14a19f]/20 rounded-lg text-white focus:outline-none focus:border-[#14a19f]/50 transition-colors"
        >
          <option value="recent">Most Recent</option>
          <option value="budget-high">Budget: High to Low</option>
          <option value="budget-low">Budget: Low to High</option>
          <option value="deadline-soon">Deadline Soon</option>
          <option value="bids-high">Most Bids</option>
        </select>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors"
        >
          <X size={16} />
          Clear Filters
        </button>
      )}
    </div>
  );
}

export default JobFilters;
