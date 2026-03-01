import React, { useEffect } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export default function NoticeToast({ message, isError = false, onClose }) {
  if (!message) return null;

  useEffect(() => {
    if (!onClose) return undefined;
    const timer = setTimeout(() => onClose(), 4200);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const containerClasses = isError
    ? "border-red-500/30 bg-[#2a1117]/95 text-red-100 shadow-[0_12px_28px_rgba(60,10,15,0.38)]"
    : "border-[#14a19f]/35 bg-[#0f1c2f]/95 text-cyan-100 shadow-[0_12px_28px_rgba(7,25,42,0.4)]";

  return (
    <div className="fixed top-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div
        className={`notice-toast-enter relative flex items-start gap-3 rounded-xl border px-4 py-3 backdrop-blur-md transition-transform duration-200 hover:-translate-y-0.5 ${containerClasses}`}
        role="status"
        aria-live="polite"
      >
        <div
          className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${
            isError ? "bg-red-500/20 text-red-200" : "bg-[#14a19f]/20 text-[#61f0ed]"
          }`}
        >
          {isError ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </div>
        <p className="flex-1 text-sm leading-5 font-medium pr-1">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div
          className={`notice-progress pointer-events-none absolute bottom-0 left-0 h-[2px] ${
            isError ? "bg-red-300/80" : "bg-[#61f0ed]/80"
          }`}
          style={{ animationDuration: "4200ms" }}
        />
      </div>
    </div>
  );
}
