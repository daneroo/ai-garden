import { createFileRoute, Link } from "@tanstack/react-router";
import { Timer } from "@bun-one/timer";
import { formatTimestamp } from "@bun-one/vtt";
import { getVttSummaries, type VttFileSummary } from "../lib/vtt-server";
import {
  Zap,
  Server,
  Route as RouteIcon,
  Shield,
  Waves,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  loader: async () => {
    // Feature A: Server-side pure function - formatTimestamp runs on server
    const time = formatTimestamp(3661.5);
    // Feature B: Server-side file reading - get VTT summaries
    const vttData = await getVttSummaries();
    return { time, ...vttData };
  },
  component: App,
});

function App() {
  const { time, summaries, error, resolvedPath } = Route.useLoaderData();
  const features = [
    {
      icon: <Zap className="w-12 h-12 text-cyan-400" />,
      title: "Powerful Server Functions",
      description:
        "Write server-side code that seamlessly integrates with your client components. Type-safe, secure, and simple.",
    },
    {
      icon: <Server className="w-12 h-12 text-cyan-400" />,
      title: "Flexible Server Side Rendering",
      description:
        "Full-document SSR, streaming, and progressive enhancement out of the box. Control exactly what renders where.",
    },
    {
      icon: <RouteIcon className="w-12 h-12 text-cyan-400" />,
      title: "API Routes",
      description:
        "Build type-safe API endpoints alongside your application. No separate backend needed.",
    },
    {
      icon: <Shield className="w-12 h-12 text-cyan-400" />,
      title: "Strongly Typed Everything",
      description:
        "End-to-end type safety from server to client. Catch errors before they reach production.",
    },
    {
      icon: <Waves className="w-12 h-12 text-cyan-400" />,
      title: "Full Streaming Support",
      description:
        "Stream data from server to client progressively. Perfect for AI applications and real-time updates.",
    },
    {
      icon: <Sparkles className="w-12 h-12 text-cyan-400" />,
      title: "Next Generation Ready",
      description:
        "Built from the ground up for modern web applications. Deploy anywhere JavaScript runs.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img
              src="/tanstack-circle-logo.png"
              alt="TanStack Logo"
              className="w-24 h-24 md:w-32 md:h-32"
            />
            <h1 className="text-6xl md:text-7xl font-black text-white [letter-spacing:-0.08em]">
              <span className="text-gray-300">TANSTACK</span>{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                START
              </span>
            </h1>
          </div>

          {/* Timer Component from @bun-one/timer */}
          <div className="mb-8">
            <Timer initialSeconds={60} />
          </div>

          {/* Feature A: Server-side computed time using @bun-one/vtt */}
          <div className="mb-4 text-center">
            <span className="text-gray-400">Server-computed time: </span>
            <span className="font-mono text-green-400 font-bold">{time}</span>
          </div>

          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            The framework for next generation AI applications
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Full-stack framework powered by TanStack Router for React and Solid.
            Build modern applications with server functions, streaming, and type
            safety.
          </p>
          <div className="flex flex-col items-center gap-4">
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
            >
              Documentation
            </a>
            <p className="text-gray-400 text-sm mt-2">
              Begin your TanStack Start journey by editing{" "}
              <code className="px-2 py-1 bg-slate-700 rounded text-cyan-400">
                /src/routes/index.tsx
              </code>
            </p>
          </div>
        </div>
      </section>

      {/* Feature B: VTT Summaries Table */}
      {summaries && summaries.length > 0 && (
        <section className="py-8 px-6 max-w-7xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">
                VTT Files{" "}
                {resolvedPath && (
                  <span className="text-gray-500 text-sm font-normal">
                    ({resolvedPath})
                  </span>
                )}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      File
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Start
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      End
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                      Cues
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {summaries.map((s: VttFileSummary) => (
                    <tr key={s.filename} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-sm font-medium">
                        <Link
                          to="/file/$name"
                          params={{ name: s.filename }}
                          className="text-cyan-400 hover:text-cyan-300 hover:underline"
                        >
                          {s.filename}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                        {s.firstCueStart}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                        {s.lastCueEnd}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                        {formatTimestamp(s.durationSec)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 font-mono text-right">
                        {s.cueCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.monotonicityViolations === 0
                              ? "bg-green-900 text-green-300"
                              : "bg-red-900 text-red-300"
                          }`}
                        >
                          {s.monotonicityViolations === 0
                            ? "Valid"
                            : `${s.monotonicityViolations} Violations`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="py-8 px-6 max-w-7xl mx-auto">
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-yellow-200">
            VTT Directory: {error}
          </div>
        </section>
      )}

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
