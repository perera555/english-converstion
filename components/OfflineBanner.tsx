"use client";

import { useEffect, useState } from "react";

/** Shows a small notice while the device is offline. */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div className="sticky top-16 z-30 bg-amber-400 px-4 py-1.5 text-center text-xs font-bold text-black">
      📴 You&apos;re offline: saved lessons, twisters and the 🧠 Built-in voice recognizer still work. Videos need internet.
    </div>
  );
}
