import React, { useState } from 'react';

const jobImages = [
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80", // Tech
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80", // Design
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80", // Writing
  "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80", // Backend
  "https://images.unsplash.com/photo-1482062364825-616fd23b8fc1?auto=format&fit=crop&w=800&q=80", // Data
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80", // DevOps
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80", // Mobile
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80", // Docs
];

const orbitronStyle = {
  fontFamily: '"Orbitron", sans-serif',
};

const robotoStyle = {
  fontFamily: '"Roboto", sans-serif',
};

const MyJobsTabs = () => {
  const [activeTab, setActiveTab] = useState('Active');
  const tabs = ['Active', 'Pending Proposals', 'Completed'];

  const activeJobs = [
    {
      id: "proj-001",
      projectName: "SmartContract Auditor - DAO Governance with Solidity EVM",
      client: "Suraj Singh",
      jobType: "Fixed Price",
      budget: 7500,
      postedDate: "2025-09-28",
      description: "Audit DAO governance contracts and provide a security report."
    },
    {
      id: "proj-002",
      projectName: "React Frontend for E-commerce Dashboard",
      client: "Alice Johnson",
      jobType: "Hourly",
      budget: 55,
      postedDate: "2025-09-25",
      description: "Build a responsive admin dashboard with Redux state management."
    }
  ];

  const pendingProposals = [
    {
      id: "prop-101",
      projectName: "API Integration for Payment Gateway",
      client: "PayFlow",
      proposedAmount: 1200,
      proposalDate: "2025-09-29",
      status: "Under Review",
      coverLetter: "I can integrate Payment Gateway with webhooks and retries."
    },
    {
      id: "prop-102",
      projectName: "Landing Page Redesign",
      client: "BrightCo",
      proposedAmount: 400,
      proposalDate: "2025-09-26",
      status: "Awaiting Client",
      coverLetter: "Focused on conversion-first design and fast load times."
    }
  ];

  const completedJobs = [
    {
      id: "comp-201",
      projectName: "Mobile App Bug Fixes",
      client: "Gourmet Group",
      completedDate: "2025-08-15",
      totalPaid: 1500,
      rating: 4.8,
      summary: "Fixed crashes, optimized images, added unit tests."
    },
    {
      id: "comp-202",
      projectName: "Technical Docs for REST APIs",
      client: "APIMatic",
      completedDate: "2025-07-30",
      totalPaid: 600,
      rating: 5.0,
      summary: "Delivered OpenAPI specs, examples and usage guides."
    }
  ];

  return (
    <div className='my-jobs'>
      <div
        className='flex space-x-6 border-b border-gray-700'
        style={orbitronStyle}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              text-xl
              pb-2 
              border-b-2 
              transition-colors 
              duration-300
              focus:outline-none
              ${activeTab === tab
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className='mt-4 text-white'>
        {activeTab === 'Active' && (
          <div className='space-y-5'>
            {activeJobs.map((item, idx) => (
              <div key={item.id} className="
                max-w-lg 
                rounded-xl 
                relative 
                overflow-hidden
                dark:bg-[#0f121e] 
                p-6 
                shadow-md 
                flex 
                flex-col 
                gap-4
                transition-all 
                duration-300
              ">
                <div className="flex items-start gap-4">
                  <img
                    src={jobImages[idx % jobImages.length]}
                    className="w-24 h-28 rounded-lg object-cover"
                    alt="Job Visual"
                  />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white" style={orbitronStyle}>{item.projectName}</h4>
                    <p className="text-sm text-blue-200" style={robotoStyle}>by {item.client}</p>
                    <p className="text-xs text-gray-400" style={robotoStyle}>Posted: <span className="font-medium">{item.postedDate}</span></p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-sm text-gray-200" style={robotoStyle}>{item.description}</p>
                  <div className="text-right">
                    <p className="text-base font-bold text-white" style={orbitronStyle}>
                      {item.jobType === "Hourly" ? `$${item.budget}/hr` : `$${item.budget}`}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-white">{item.jobType}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-md" style={robotoStyle}>Message Client</button>
                  <button className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white text-sm rounded-md" style={robotoStyle}>Submit Work</button>
                  <button className="px-3 py-1 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded-md" style={robotoStyle}>View Contract</button>
                  <button className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md" style={robotoStyle}>Request Payment</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Pending Proposals' && (
          <div className='space-y-5'>
            {pendingProposals.map((prop, idx) => (
              <div key={prop.id} className="
                max-w-lg 
                rounded-xl 
                relative 
                overflow-hidden
                dark:bg-[#0f121e] 
                p-6 
                shadow-md 
                flex 
                flex-col 
                gap-4
                transition-all 
                duration-300
              ">
                <div className="flex items-start gap-4">
                  <img
                    src={jobImages[(idx + 2) % jobImages.length]}
                    className="w-24 h-28 rounded-lg object-cover"
                    alt="Proposal Visual"
                  />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white" style={orbitronStyle}>{prop.projectName}</h4>
                    <p className="text-sm text-blue-200" style={robotoStyle}>to {prop.client}</p>
                    <p className="text-xs text-gray-400" style={robotoStyle}>Submitted: <span className="font-medium">{prop.proposalDate}</span></p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-sm text-gray-200" style={robotoStyle}>{prop.coverLetter}</p>
                  <div className="text-right">
                    <p className="text-base font-bold text-white" style={orbitronStyle}>${prop.proposedAmount}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${prop.status === 'Under Review' ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-white'}`}>
                      {prop.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="px-3 py-1 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded-md" style={robotoStyle}>Edit Proposal</button>
                  <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md" style={robotoStyle}>Withdraw</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Completed' && (
          <div className='space-y-5'>
            {completedJobs.map((job, idx) => (
              <div key={job.id} className="
                max-w-lg 
                rounded-xl 
                relative 
                overflow-hidden
                dark:bg-[#0f121e] 
                p-6 
                shadow-md 
                flex 
                flex-col 
                gap-4
                transition-all 
                duration-300
              ">
                <div className="flex items-start gap-4">
                  <img
                    src={jobImages[(idx + 4) % jobImages.length]}
                    className="w-24 h-28 rounded-lg object-cover"
                    alt="Completed Visual"
                  />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white" style={orbitronStyle}>{job.projectName}</h4>
                    <p className="text-sm text-blue-200" style={robotoStyle}>with {job.client}</p>
                    <p className="text-xs text-gray-400" style={robotoStyle}>Completed: <span className="font-medium">{job.completedDate}</span></p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-sm text-gray-200" style={robotoStyle}>{job.summary}</p>
                  <div className="text-right">
                    <p className="text-base font-bold text-white" style={orbitronStyle}>${job.totalPaid}</p>
                    <p className="text-sm text-yellow-400">{job.rating} ★</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="px-3 py-1 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded-md" style={robotoStyle}>View Contract</button>
                  <button className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-md" style={robotoStyle}>Leave Review</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyJobsTabs;