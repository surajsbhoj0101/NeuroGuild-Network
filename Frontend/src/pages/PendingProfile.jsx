import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { completePendingRegistration } from "../utils/completeRegistration";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";

const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
const robotoStyle = { fontFamily: "Roboto, sans-serif" };

export default function PendingProfile() {
  const { role, isPending, setAuthState } = useAuth();
  const navigate = useNavigate();
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isPending) {
    // User is not pending, redirect to appropriate dashboard
    if (role === "freelancer") {
      navigate("/freelancer/dashboard");
    } else if (role === "client") {
      navigate("/client/my-profile");
    } else {
      navigate("/");
    }
    return null;
  }

  const handleCompleteRegistration = async () => {
    try {
      setIsCompleting(true);
      setError(null);
      
      await completePendingRegistration();
      
      // Refresh auth state to get updated user info
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/check-jwt`,
        { credentials: "include" }
      );
      
      if (res.ok) {
        const data = await res.json();
        if (data.isFound && !data.isPending && data.userId) {
          setAuthState({
            role: data.role,
            userId: data.userId,
            isPending: false,
          });
          
          // Redirect to profile completion
          if (role === "freelancer") {
            navigate("/freelancer/my-profile");
          } else {
            navigate("/client/my-profile");
          }
        }
      }
    } catch (err) {
      setError(err.message || "Failed to complete registration");
    } finally {
      setIsCompleting(false);
    }
  };

  const getRoleInfo = () => {
    if (role === "freelancer") {
      return {
        title: "Welcome, Freelancer!",
        description: "You're almost ready to start finding work.",
        nextSteps: [
          "Complete your profile with skills and experience",
          "Get your profile verified",
          "Start applying to jobs",
        ],
        actionLabel: "Continue to Profile Setup",
      };
    } else if (role === "client") {
      return {
        title: "Welcome, Client!",
        description: "You're almost ready to start posting jobs.",
        nextSteps: [
          "Complete your company profile",
          "Set up your payment information",
          "Post your first job",
        ],
        actionLabel: "Continue to Profile Setup",
      };
    }
    return {
      title: "Welcome to NeuroGuild",
      description: "Complete your profile to get started.",
      nextSteps: [],
      actionLabel: "Get Started",
    };
  };

  const { title, description, nextSteps, actionLabel } = getRoleInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161c32] via-[#0f111d] to-[#161c32] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Card Container */}
        <div className="rounded-3xl border border-[#14a19f]/20 bg-[#0d1224]/50 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header with Gradient */}
          <div className="relative h-40 bg-gradient-to-r from-[#14a19f]/20 to-blue-500/20 border-b border-[#14a19f]/10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl opacity-20">
                {role === "freelancer" ? "🚀" : "💼"}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12">
            {/* Title */}
            <h1
              style={orbitronStyle}
              className="text-3xl sm:text-4xl font-bold text-white mb-4 text-center"
            >
              {title}
            </h1>

            {/* Description */}
            <p
              style={robotoStyle}
              className="text-gray-300 text-center mb-8 text-lg"
            >
              {description}
            </p>

            {/* Progress Indicator */}
            <div className="mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#14a19f]"></div>
                <span className="text-sm text-gray-400">
                  Step 1 of 2 - Activate Account
                </span>
              </div>
              <div className="h-1 bg-[#223041] rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-gradient-to-r from-[#14a19f] to-blue-500 rounded-full transition-all duration-500"></div>
              </div>
            </div>

            {/* Next Steps */}
            {nextSteps.length > 0 && (
              <div className="mb-10 p-6 rounded-xl bg-[#14a19f]/5 border border-[#14a19f]/10">
                <h3 style={orbitronStyle} className="text-white font-semibold mb-4">
                  What's Next:
                </h3>
                <ul className="space-y-3">
                  {nextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle
                        size={20}
                        className="text-[#14a19f] flex-shrink-0 mt-0.5"
                      />
                      <span style={robotoStyle} className="text-gray-400">
                        {step}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">Error</p>
                  <p style={robotoStyle} className="text-red-300/80 text-sm">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleCompleteRegistration}
              disabled={isCompleting}
              className="w-full py-3 px-6 bg-gradient-to-r from-[#14a19f] to-blue-500 hover:from-[#14a19f]/80 hover:to-blue-500/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isCompleting ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Setting up your account...
                </>
              ) : (
                actionLabel
              )}
            </button>

            {/* Beta Badge */}
            <div className="mt-8 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-[#14a19f]/10 border border-[#14a19f]/20 text-[#14a19f] text-xs font-medium">
                🎯 New Feature - Smarter Onboarding
              </span>
            </div>
          </div>
        </div>

        {/* Info Text */}
        <p
          style={robotoStyle}
          className="text-center text-gray-500 text-sm mt-8"
        >
          You won't be added to the network until you complete this setup.
          <br />
          This ensures a quality community of active users.
        </p>
      </div>
    </div>
  );
}
