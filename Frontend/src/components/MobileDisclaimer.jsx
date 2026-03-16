import { useEffect, useState } from "react";

const STORAGE_KEY = "ng-mobile-pc-disclaimer-seen";

function MobileDisclaimer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isSeen = localStorage.getItem(STORAGE_KEY) === "1";
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (!isSeen && isMobile) {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-[#14a19f]/35 bg-[#0d1224]/95 p-4 text-white shadow-2xl backdrop-blur-md">
        <p className="text-sm leading-6 text-gray-200">
          For a better experience, continue.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-[#14a19f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1ecac7]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobileDisclaimer;
