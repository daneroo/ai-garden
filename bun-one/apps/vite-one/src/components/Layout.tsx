import { useState, useEffect } from "react";
import { NavLink, Outlet, useMatches } from "react-router-dom";
import { ThemeController, type Theme } from "./ThemeController";
import type { RouteHandle } from "../App";

/**
 * Layout mode controls how the main content area is styled.
 *
 * @mode "contained" - Standard pages
 *   - Horizontal: Centered with max-width (`container mx-auto px-4`)
 *   - Vertical: Below navbar with `pt-20` offset
 *
 * @mode "fullBleed" - Hero/landing pages
 *   - Horizontal: Edge-to-edge, no width constraints
 *   - Vertical: No navbar offset (page adds `pt-20` where content starts)
 *
 * @see STYLING.md for detailed documentation and examples
 */
export type LayoutMode = "contained" | "fullBleed";

/**
 * Root layout component providing navbar, footer, and content area.
 * Uses React Router's Outlet for nested route rendering.
 *
 * Layout mode is read from the matched route's `handle.layoutMode` property.
 */
export default function Layout() {
  // Read layout mode from current route's handle
  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];
  const handle = currentMatch?.handle as RouteHandle | undefined;
  const mode: LayoutMode = handle?.layoutMode ?? "contained";

  // Initialize theme from localStorage (may be null for "system")
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return "system";
  });

  // Apply theme changes to document and localStorage
  const applyTheme = (newTheme: Theme) => {
    if (newTheme === "system") {
      localStorage.removeItem("theme");
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem("theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    }
    setTheme(newTheme);
  };

  // Sync with index.html script on initial render (avoid mismatch)
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  // Main content styles based on mode
  const mainStyles =
    mode === "fullBleed"
      ? "grow" // No padding - page handles its own spacing
      : "grow pt-20 px-4 container mx-auto"; // Contained with navbar offset

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
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => (isActive ? "menu-active" : "")}
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/logo"
                  className={({ isActive }) => (isActive ? "menu-active" : "")}
                >
                  Logo
                </NavLink>
                <li>
                  <NavLink
                    to="/about"
                    className={({ isActive }) =>
                      isActive ? "menu-active" : ""
                    }
                  >
                    About
                  </NavLink>
                </li>
              </li>
            </ul>
          </div>
          <NavLink to="/" className="btn btn-ghost text-xl">
            ViteOne
          </NavLink>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal bg-base-200 rounded-box">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => (isActive ? "menu-active" : "")}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) => (isActive ? "menu-active" : "")}
              >
                About
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/logo"
                className={({ isActive }) => (isActive ? "menu-active" : "")}
              >
                Logo
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="navbar-end">
          <ThemeController theme={theme} setTheme={applyTheme} />
        </div>
      </div>

      {/* Main Content */}
      <main className={mainStyles}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-4 bg-base-300 text-base-content mt-8">
        <aside>
          <p>
            Copyright © {new Date().getFullYear()} - All right reserved by
            iMetrical
          </p>
        </aside>
      </footer>
    </div>
  );
}
