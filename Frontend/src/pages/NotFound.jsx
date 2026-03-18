import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import Snowfall from 'react-snowfall';

const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-[#0f111d] overflow-hidden flex items-center justify-center px-4">
      <Snowfall snowflakeCount={60} />
      
      {/* Background decorative blurs */}
      <div className="pointer-events-none fixed right-[1%] bottom-[20%] h-[420px] w-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
      <div className="pointer-events-none fixed left-[5%] bottom-[1%] h-[420px] w-[420px] rounded-full bg-linear-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-20 blur-3xl mix-blend-screen" />
      
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* 404 Display */}
        <div className="mb-8">
          <h1 
            className="text-8xl md:text-9xl font-bold text-[#14a19f] mb-4"
            style={orbitronStyle}
          >
            404
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-[#14a19f] to-[#1ecac7] mx-auto mb-8 rounded"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={orbitronStyle}
          >
            Page Not Found
          </h2>
          <p className="text-lg text-gray-300 mb-4" style={robotoStyle}>
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
          <p className="text-sm text-gray-400" style={robotoStyle}>
            The path you entered doesn't match any of our available pages.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#14a19f] to-[#1ecac7] text-white font-semibold rounded-lg hover:from-[#0d897f] hover:to-[#15a59f] transition-all duration-300 transform hover:scale-105"
            style={orbitronStyle}
          >
            <Home size={20} />
            Go to Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#111827] border border-[#14a19f]/30 text-white font-semibold rounded-lg hover:border-[#14a19f]/60 hover:bg-[#14a19f]/10 transition-all duration-300"
            style={orbitronStyle}
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="bg-[#0d1224]/58 backdrop-blur-md rounded-2xl p-6 border border-[#14a19f]/20">
          <h3 className="text-lg font-semibold text-white mb-4" style={orbitronStyle}>Quick Links:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Link to="/" className="text-[#8ff6f3] hover:text-[#14a19f] transition-colors" style={robotoStyle}>
              Home
            </Link>
            <Link to="/browse-jobs" className="text-[#8ff6f3] hover:text-[#14a19f] transition-colors" style={robotoStyle}>
              Browse Jobs
            </Link>
            <Link to="/governance" className="text-[#8ff6f3] hover:text-[#14a19f] transition-colors" style={robotoStyle}>
              Governance
            </Link>
            <Link to="/messages" className="text-[#8ff6f3] hover:text-[#14a19f] transition-colors" style={robotoStyle}>
              Messages
            </Link>
            <Link to="/freelancer/dashboard" className="text-[#8ff6f3] hover:text-[#14a19f] transition-colors" style={robotoStyle}>
              Freelancer Dashboard
            </Link>
            <Link to="/client/dashboard" className="text-[#8ff6f3] hover:text-[#14a19f] transition-colors" style={robotoStyle}>
              Client Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
