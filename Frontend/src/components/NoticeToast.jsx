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
    ? "border-red-200/35 bg-gradient-to-br from-red-200/18 via-rose-300/12 to-red-500/18 text-red-50 shadow-[0_16px_36px_rgba(127,29,29,0.24)]"
    : "border-cyan-100/40 bg-gradient-to-br from-cyan-100/24 via-teal-200/14 to-sky-300/16 text-cyan-50 shadow-[0_16px_36px_rgba(20,161,159,0.2)]";

  return (
    <div className="fixed top-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div
        className={`notice-toast-enter relative overflow-hidden flex items-start gap-3 rounded-2xl border px-4 py-3 backdrop-blur-3xl supports-[backdrop-filter]:bg-white/10 ring-1 ring-white/25 transition-transform duration-200 hover:-translate-y-0.5 ${containerClasses}`}
        role="status"
        aria-live="polite"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-white/15 to-transparent" />
        <div className="pointer-events-none absolute -top-8 left-4 h-16 w-40 rounded-full bg-white/35 blur-3xl" />

        <div className="mt-0.5 shrink-0">
          {isError ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </div>
        <p className="relative z-10 flex-1 text-sm leading-5 font-medium">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="relative z-10 rounded-md p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div
          className={`notice-progress pointer-events-none absolute bottom-0 left-0 h-[2px] ${
            isError ? "bg-red-200/80" : "bg-cyan-200/80"
          }`}
          style={{ animationDuration: "4200ms" }}
        />
      </div>
    </div>
  );
}
