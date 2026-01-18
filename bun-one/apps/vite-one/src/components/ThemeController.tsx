import type React from "react";

export type Theme = "system" | "light" | "dark";

interface ThemeControllerProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeController: React.FC<ThemeControllerProps> = ({
  theme,
  setTheme,
}) => {
  return (
    <div className="relative flex flex-row items-center border-2 border-base-300 bg-base-300 rounded-full">
      {/* Sliding indicator */}
      <div
        className={`absolute w-1/3 h-full rounded-full border border-base-200 bg-base-100 transition-all duration-200 ${
          theme === "system"
            ? "left-0"
            : theme === "light"
              ? "left-1/3"
              : "left-2/3"
        }`}
      />

      {/* System button */}
      <button
        className="flex p-2 cursor-pointer w-1/3 z-10 justify-center"
        onClick={() => setTheme("system")}
        title="System preference"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 opacity-75 hover:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Light button */}
      <button
        className="flex p-2 cursor-pointer w-1/3 z-10 justify-center"
        onClick={() => setTheme("light")}
        title="Light mode"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 opacity-75 hover:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </button>

      {/* Dark button */}
      <button
        className="flex p-2 cursor-pointer w-1/3 z-10 justify-center"
        onClick={() => setTheme("dark")}
        title="Dark mode"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 opacity-75 hover:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </button>
    </div>
  );
};
