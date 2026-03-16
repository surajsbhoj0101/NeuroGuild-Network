import React, { useEffect } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export default function NoticeToast({ message, isError = false, onClose }) {
  useEffect(() => {
    if (!message || !onClose) return undefined;
    const timer = setTimeout(() => onClose(), 4200);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const containerClasses = isError
    ? "border-red-300/35 bg-red-900/20 text-red-100 shadow-[0_12px_32px_rgba(60,10,15,0.28)]"
    : "border-[#61f0ed]/30 bg-cyan-900/20 text-cyan-100 shadow-[0_12px_32px_rgba(7,25,42,0.3)]";

  return (
    <div className="fixed top-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div
        className={`notice-toast-enter relative overflow-hidden flex items-start gap-3 rounded-xl border px-4 py-3 backdrop-blur-xl supports-backdrop-filter:backdrop-saturate-150 transition-transform duration-200 hover:-translate-y-0.5 ${containerClasses}`}
        role="status"
        aria-live="polite"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/12 via-white/6 to-transparent"
        />
        <div
          className={`relative z-10 mt-0.5 shrink-0 rounded-lg p-1.5 ${
            isError ? "bg-red-400/18 border border-red-300/25 text-red-200" : "bg-[#14a19f]/18 border border-[#61f0ed]/20 text-[#61f0ed]"
          }`}
        >
          {isError ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </div>
        <p className="relative z-10 flex-1 text-sm leading-5 font-medium pr-1">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="relative z-10 rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div
          className={`notice-progress pointer-events-none absolute bottom-0 left-0 z-10 h-0.5 ${
            isError ? "bg-red-300/80" : "bg-[#61f0ed]/80"
          }`}
          style={{ animationDuration: "4200ms" }}
        />
      </div>
    </div>
  );
}
