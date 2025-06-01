import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

const PWAInstallPrompt = ({ isDarkMode }) => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if already installed
    window.matchMedia("(display-mode: standalone)").matches &&
      setIsInstalled(true);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  if (isInstalled || !installPrompt) return null;

  return (
    <button
      onClick={handleInstallClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isDarkMode
          ? "bg-blue-600 hover:bg-blue-700 text-white"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      }`}
    >
      <Download className="w-4 h-4" />
      Install App
    </button>
  );
};

export default PWAInstallPrompt;
