import React, { useEffect, useState } from "react";

export default function MatchScore({ score = 72 }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let start = 0;
    const animation = setInterval(() => {
      start += 1;
      if (start <= score) {
        setProgress(start);
      } else {
        clearInterval(animation);
      }
    }, 15);

    return () => clearInterval(animation);
  }, [score]);

  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Glow animation */}
      <div className="absolute w-40 h-40 rounded-full animate-pulse blur-md bg-indigo-500/30"></div>

      {/* Background Circle */}
      <svg width="160" height="160">
        <circle
          stroke="#1e293b"
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx="80"
          cy="80"
        />
        {/* Progress Circle */}
        <circle
          stroke="#6366f1"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx="80"
          cy="80"
          className="transition-all duration-300"
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      </svg>

      {/* Percentage Text */}
      <div className="absolute flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white">{progress}%</h1>
        <p className="text-sm text-gray-300">Match</p>
      </div>
    </div>
  );
}
