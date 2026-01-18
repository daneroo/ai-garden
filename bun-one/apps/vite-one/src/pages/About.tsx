import "../index.css";

/**
 * About page - uses contained layout mode (declared in App.tsx routes)
 * Layout provides padding and centering automatically
 */
function About() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      {/* Page Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-base-content mb-4">
          About ViteOne
        </h1>
        <p className="text-lg text-base-content/70">
          A modern React application built with bleeding-edge tooling in a Bun
          monorepo. This project demonstrates best practices for DaisyUI theming
          and shared component architecture.
        </p>
      </header>

      {/* Tech Stack Timeline */}
      <section>
        <h2 className="text-2xl font-semibold text-base-content mb-6">
          Tech Stack
        </h2>

        <ul className="timeline timeline-vertical">
          {/* Bun */}
          <li>
            <div className="timeline-middle">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-content text-xs font-bold">
                  B
                </span>
              </div>
            </div>
            <div className="timeline-end timeline-box">
              <h3 className="font-semibold text-base-content">Bun</h3>
              <p className="text-sm text-base-content/70">
                Fast JavaScript runtime and package manager. Powers the monorepo
                workspace.
              </p>
            </div>
            <hr className="bg-primary" />
          </li>

          {/* Vite */}
          <li>
            <hr className="bg-primary" />
            <div className="timeline-middle">
              <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-secondary-content text-xs font-bold">
                  V
                </span>
              </div>
            </div>
            <div className="timeline-end timeline-box">
              <h3 className="font-semibold text-base-content">Vite</h3>
              <p className="text-sm text-base-content/70">
                Next-generation frontend build tool with instant HMR and
                lightning-fast cold starts.
              </p>
            </div>
            <hr className="bg-secondary" />
          </li>

          {/* React */}
          <li>
            <hr className="bg-secondary" />
            <div className="timeline-middle">
              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <span className="text-accent-content text-xs font-bold">R</span>
              </div>
            </div>
            <div className="timeline-end timeline-box">
              <h3 className="font-semibold text-base-content">React</h3>
              <p className="text-sm text-base-content/70">
                Component-based UI library for building interactive user
                interfaces.
              </p>
            </div>
            <hr className="bg-accent" />
          </li>

          {/* Tailwind CSS */}
          <li>
            <hr className="bg-accent" />
            <div className="timeline-middle">
              <div className="w-5 h-5 rounded-full bg-info flex items-center justify-center">
                <span className="text-info-content text-xs font-bold">T</span>
              </div>
            </div>
            <div className="timeline-end timeline-box">
              <h3 className="font-semibold text-base-content">Tailwind CSS</h3>
              <p className="text-sm text-base-content/70">
                Utility-first CSS framework for rapid, responsive styling.
              </p>
            </div>
            <hr className="bg-info" />
          </li>

          {/* DaisyUI */}
          <li>
            <hr className="bg-info" />
            <div className="timeline-middle">
              <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                <span className="text-success-content text-xs font-bold">
                  D
                </span>
              </div>
            </div>
            <div className="timeline-end timeline-box">
              <h3 className="font-semibold text-base-content">DaisyUI</h3>
              <p className="text-sm text-base-content/70">
                Semantic component classes for Tailwind. Pure CSS, zero JS
                overhead.
              </p>
            </div>
            <hr className="bg-success" />
          </li>

          {/* Shared Components */}
          <li>
            <hr className="bg-success" />
            <div className="timeline-middle">
              <div className="w-5 h-5 rounded-full bg-warning flex items-center justify-center">
                <span className="text-warning-content text-xs font-bold">
                  S
                </span>
              </div>
            </div>
            <div className="timeline-end timeline-box">
              <h3 className="font-semibold text-base-content">
                Shared Components
              </h3>
              <p className="text-sm text-base-content/70">
                Monorepo packages like <code>@bun-one/timer</code> for reusable
                React components.
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default About;
