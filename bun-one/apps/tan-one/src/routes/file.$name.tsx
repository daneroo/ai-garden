import { createFileRoute, Link } from "@tanstack/react-router";
import { getVttFile } from "../lib/vtt-server";
import { VttViewer } from "../components/VttViewer";

export const Route = createFileRoute("/file/$name")({
  loader: async ({ params }) => {
    return await getVttFile({ data: params.name });
  },
  component: DetailPage,
});

function DetailPage() {
  const { detail, error } = Route.useLoaderData();

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block"
          >
            &larr; Back
          </Link>
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* File Info Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white font-mono">
              {detail.filename}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                detail.warnings.length === 0
                  ? "bg-green-900 text-green-300"
                  : "bg-yellow-900 text-yellow-300"
              }`}
            >
              {detail.artifactType}
              {detail.segmentCount != null
                ? ` (${detail.segmentCount} segments)`
                : ""}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Duration</div>
              <div className="text-lg font-mono font-semibold text-white">
                {detail.formattedDuration}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Cue Count</div>
              <div className="text-lg font-mono font-semibold text-white">
                {detail.cueCount}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Start</div>
              <div className="text-lg font-mono font-semibold text-white">
                {detail.firstCueStart}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">End</div>
              <div className="text-lg font-mono font-semibold text-white">
                {detail.lastCueEnd}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {detail.warnings.length > 0 && (
            <div className="px-6 pb-6">
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-300 mb-2">
                  Warnings ({detail.warnings.length})
                </h3>
                <ul className="space-y-1">
                  {detail.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-yellow-200 font-mono">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Cues List with Violation Filtering */}
        <VttViewer cues={detail.cues} />
      </div>
    </div>
  );
}
