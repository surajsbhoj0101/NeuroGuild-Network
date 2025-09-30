import React, { useState } from 'react';

// Assuming you have this style object for the Orbitron font
const orbitronStyle = {
  fontFamily: '"Orbitron", sans-serif',
};

const MyJobsTabs = () => {
  // 1. State to keep track of the active tab
  const [activeTab, setActiveTab] = useState('Active');
  
  // 2. An array to make the code cleaner and more scalable
  const tabs = ['Active', 'Pending Proposals', 'Completed'];

  return (
    <div className='my-jobs '>
    
      <div 
        className='flex space-x-6 border-b border-gray-700' 
        style={orbitronStyle}
      >
        {/* 3. Map over the array to create tabs dynamically */}
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
              ${
                activeTab === tab
                  ? 'border-blue-500 text-white' // 4. Active tab style
                  : 'border-transparent text-gray-400 hover:text-gray-200' // Inactive tab style
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      
      <div className='mt-4 text-white'>
        {activeTab === 'Active' && <div>Showing Active Jobs...</div>}
        {activeTab === 'Pending Proposals' && <div>Showing Pending Proposals...</div>}
        {activeTab === 'Completed' && <div>Showing Completed Jobs...</div>}
      </div>
    </div>
  );
};

export default MyJobsTabs;