import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ThemeController } from "./ThemeController";

export default function Layout({ children }: { children: React.ReactNode }) {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  // Sync theme to document and localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-100 text-base-content">
      {/* Navbar */}
      <div className="navbar base-100 shadow-sm fixed top-0 z-50 bg-base-100/90 backdrop-blur">
        <div className="navbar-start">
          <div className="dropdown">
            <div role="button" tabIndex={0} className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-1 p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
            </ul>
          </div>
          <Link to="/" className="btn btn-ghost text-xl">
            ViteOne
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
          </ul>
        </div>
        <div className="navbar-end">
          <ThemeController theme={theme} toggleTheme={toggleTheme} />
        </div>
      </div>

      {/* Main Content */}
      <main className="grow pt-20 px-4 container mx-auto">{children}</main>

      {/* Footer */}
      <footer className="footer footer-center p-4 bg-base-300 text-base-content mt-8">
        <aside>
          <p>
            Copyright © {new Date().getFullYear()} - All right reserved by ACME
            Industries Ltd
          </p>
        </aside>
      </footer>
    </div>
  );
}
