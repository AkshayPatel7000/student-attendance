const AppNameComponent = ({ isDarkMode, size = "small" }) => {
  const isLarge = size === "large";
  const logoSize = isLarge ? "w-16 h-16" : "w-8 h-8";
  const textSize = isLarge ? "text-3xl" : "text-xl";
  const containerClass = isLarge
    ? "flex flex-col items-center"
    : "flex items-center gap-3";

  return (
    <div className={containerClass}>
      {/* QR Code-like Logo */}
      <div className={`${logoSize} ${isLarge ? "mb-4" : ""}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect
            x="10"
            y="10"
            width="25"
            height="25"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
          <rect
            x="15"
            y="15"
            width="15"
            height="15"
            fill={isDarkMode ? "#1F2937" : "#FFFFFF"}
          />
          <rect
            x="20"
            y="20"
            width="5"
            height="5"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />

          <rect
            x="10"
            y="65"
            width="25"
            height="25"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
          <rect
            x="15"
            y="70"
            width="15"
            height="15"
            fill={isDarkMode ? "#1F2937" : "#FFFFFF"}
          />
          <rect
            x="20"
            y="75"
            width="5"
            height="5"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />

          <rect
            x="65"
            y="10"
            width="25"
            height="25"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
          <rect
            x="70"
            y="15"
            width="15"
            height="15"
            fill={isDarkMode ? "#1F2937" : "#FFFFFF"}
          />
          <rect
            x="75"
            y="20"
            width="5"
            height="5"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />

          <rect
            x="45"
            y="45"
            width="10"
            height="10"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
          <rect
            x="60"
            y="45"
            width="5"
            height="5"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
          <rect
            x="70"
            y="45"
            width="5"
            height="5"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
          <rect
            x="80"
            y="45"
            width="5"
            height="5"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />

          <rect
            x="45"
            y="60"
            width="5"
            height="5"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
          <rect
            x="55"
            y="60"
            width="5"
            height="5"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
          <rect
            x="65"
            y="60"
            width="10"
            height="5"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
          <rect
            x="80"
            y="60"
            width="5"
            height="10"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />

          <rect
            x="45"
            y="75"
            width="5"
            height="10"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
          <rect
            x="55"
            y="75"
            width="15"
            height="5"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
          <rect
            x="75"
            y="75"
            width="10"
            height="10"
            fill={isDarkMode ? "#60A5FA" : "#2563EB"}
          />
        </svg>
      </div>

      {/* App Name */}
      <div
        className={`font-bold ${textSize} ${
          isDarkMode ? "text-white" : "text-gray-800"
        } flex items-center`}
      >
        <span>ATT</span>
        <span className="relative">
          <div
            className={`absolute -right-6 top-1/2 -translate-y-1/2 flex flex-col  ${
              isLarge ? "gap-1.5" : "gap-1"
            }`}
          >
            {/* Horizontal lines making 'E' */}
            <div className={`h-1 ${isLarge ? "w-5" : "w-4"} bg-purple-500`} />
            <div className={`h-1 ${isLarge ? "w-4" : "w-3"} bg-purple-500`} />
            <div className={`h-1 ${isLarge ? "w-5" : "w-4"} bg-purple-500`} />
          </div>
        </span>
        <span className="ml-7">NDO</span>
      </div>
    </div>
  );
};
export default AppNameComponent;
