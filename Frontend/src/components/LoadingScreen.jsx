import React from "react";

const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
const robotoStyle = { fontFamily: "Roboto, sans-serif" };

export default function LoadingScreen({
  title = "Waking up server...",
  subtitle = "This may take up to 30 seconds",
  failed = false,
  onRetry,
  isRetrying = false,
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#05070d] text-white animate-[fadeIn_500ms_ease-out]">
      <div className="pointer-events-none absolute -left-28 -top-28 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-[#14a19f]/20 via-[#1ecac7]/10 to-transparent blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-20 top-24 h-[320px] w-[320px] rounded-full bg-gradient-to-br from-[#2846a6]/25 via-[#14a19f]/10 to-transparent blur-3xl animate-pulse" />

      <div className="relative mx-6 w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-[#0e1220]/95 to-[#090d18]/95 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-500">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full border border-[#14a19f]/30 bg-[#0c1627] shadow-[0_0_40px_rgba(20,161,159,0.22)]">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#1ecac7] border-r-[#14a19f]/80 animate-[spin_1.2s_linear_infinite]" />
            <div className="absolute inset-[7px] rounded-full border border-[#1ecac7]/30 animate-pulse" />
            <div className="absolute inset-[15px] rounded-full bg-[#1ecac7] shadow-[0_0_20px_rgba(30,202,199,0.7)] animate-pulse" />
          </div>
        </div>

        <h2 className="text-center text-xl font-semibold tracking-wide text-white" style={orbitronStyle}>
          {failed ? "Backend is still sleeping" : title}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400" style={robotoStyle}>
          {failed ? "Could not reach backend yet. Please try again." : subtitle}
        </p>

        <div className="mt-6 space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#14a19f] via-[#1ecac7] to-[#8ff6f3] animate-[loadingSlide_1.8s_ease-in-out_infinite]" />
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#2846a6] via-[#14a19f] to-[#1ecac7] animate-[loadingSlide_2.2s_ease-in-out_infinite]" />
          </div>
        </div>

        {failed && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="mt-6 w-full rounded-xl border border-[#1ecac7]/40 bg-[#102233] px-4 py-2.5 text-sm font-semibold text-[#b9fffd] transition-all duration-300 hover:border-[#1ecac7]/70 hover:bg-[#14314a] disabled:cursor-not-allowed disabled:opacity-60"
            style={orbitronStyle}
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
