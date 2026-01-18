import { Link } from "react-router-dom";
import { Timer } from "@bun-one/timer";
import "../index.css";

/**
 * Home page - uses fullBleed layout mode (declared in App.tsx routes)
 * Page handles its own full-height gradient that extends behind navbar
 */
function Home() {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10">
      {/* Hero Section */}
      <div className="hero min-h-[70vh]">
        <div className="hero-content flex-col lg:flex-row-reverse gap-8 lg:gap-16">
          {/* Vite Logo with Glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
            <img
              src="/vite.svg"
              alt="Vite Logo"
              className="relative w-48 h-48 lg:w-64 lg:h-64 drop-shadow-2xl"
            />
          </div>

          {/* Hero Content */}
          <div className="text-center lg:text-left max-w-lg">
            <h1 className="text-5xl lg:text-6xl font-bold text-base-content">
              ViteOne
            </h1>
            <p className="py-4 text-xl text-base-content/80">
              Build blazing-fast apps with modern tooling
            </p>

            {/* Tech Stack Badges */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start py-4">
              <span className="badge badge-primary badge-outline">Vite</span>
              <span className="badge badge-secondary badge-outline">React</span>
              <span className="badge badge-secondary badge-outline">
                Tailwind
              </span>
              <span className="badge badge-secondary badge-outline">
                DaisyUI
              </span>
              <span className="badge badge-primary badge-outline">
                Bun Monorepo
              </span>
            </div>

            {/* CTAs */}
            <div className="flex gap-4 justify-center lg:justify-start pt-4">
              <button className="btn btn-primary">Get Started</button>
              <Link to="/about" className="btn btn-ghost">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Component Demo */}
      <div className="flex justify-center py-8">
        <div className="card bg-base-200/50 shadow-sm">
          <div className="card-body py-3 px-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-base-content/60 uppercase tracking-wide">
                Shared Component
              </span>
              <Timer initialSeconds={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
