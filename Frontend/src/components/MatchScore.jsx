import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { useTheme } from "../contexts/ThemeContext";

ChartJS.register(ArcElement, Tooltip);

function MatchScore({ matchPercentage = 70 }) {

  const match = Math.min(Math.max(matchPercentage, 0), 100);
  const data = [match, 100 - match];
  const { isDarkMode, toggleDark } = useTheme();
  const [ring, setRing] = useState()

  useEffect(() => {
    if (isDarkMode) {
      setRing("#0a184b")
    } else {
      setRing("#1be4e0")
    }
  }, [isDarkMode])



  const chartData = {
    labels: ["Match", "Remaining"],
    datasets: [
      {
        data,
        backgroundColor: [
          ring,
          "rgba(226, 232, 240, 0.3)" // Soft gray for remaining
        ],
        borderWidth: 0,
        cutout: "80%", // Creates ring thickness
      },
    ],
  };

  const chartOptions = {
    plugins: {
      tooltip: { enabled: false },
    },
    cutout: "70%",
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <h2 className="text-lg font-medium text-gray-300">
        AI Match Score
      </h2>

      <div className="relative w-32 h-32">
        <Doughnut data={chartData} options={chartOptions} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-bold dark:text-white text-[#14a19f]">{match}%</h2>
          <p className="text-xs text-gray-400">Profile Match</p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-400 mt-2">
        Based on your skills and experience
      </p>
    </div>
  );
}

export default MatchScore;
