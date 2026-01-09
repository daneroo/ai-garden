import { formatTimestamp, type VttSummary } from "@deno-one/vtt";
import Timer from "../islands/Timer.tsx";

interface HomeProps {
  time: string;
  summaries: (VttSummary & { filename: string })[];
  resolvedPath: string;
  error: string | null;
}

export default function Home(props: HomeProps) {
  const { time, summaries, resolvedPath, error } = props;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Prosody</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <div class="p-8 font-sans">
          <div class="max-w-screen-xl mx-auto space-y-8">
            {/* Header Section */}
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">
                  Prosody
                </h1>
                <p class="text-gray-500 mt-2">
                  Fresh 2.0 Native • SSR Only • Deno Workspace
                </p>
              </div>
              <div class="flex items-center gap-6">
                <Timer />
                <div class="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-sm md:text-right">
                  <span class="block text-gray-400 text-xs uppercase tracking-wide font-semibold">
                    Shared Library Output
                  </span>
                  <span class="font-mono text-green-600 font-bold text-lg">
                    {time}
                  </span>
                </div>
              </div>
            </div>

            {/* Directory Info */}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span class="text-gray-400">VTT_DIR:</span>
                  <span class="font-mono text-sm bg-gray-200 px-2 py-1 rounded text-gray-700 select-all">
                    {resolvedPath || "Unknown"}
                  </span>
                </h2>
                <span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {summaries.length} files
                </span>
              </div>

              {error && (
                <div class="p-6 bg-red-50 border-b border-red-100">
                  <div class="flex items-center gap-3 text-red-700 font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Error: {error}
                  </div>
                </div>
              )}

              {!error && summaries.length === 0 && (
                <div class="p-12 text-center text-gray-500">
                  <p class="text-lg">No VTT files found in this directory.</p>
                </div>
              )}

              {!error && summaries.length > 0 && (
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          File Name
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Start
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          End
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Duration
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Cues
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Monotonicity Violations
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      {summaries.map((s) => (
                        <tr
                          key={s.filename}
                          class="hover:bg-gray-50 transition-colors"
                        >
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <a
                              href={`/file/${s.filename}`}
                              class="text-blue-600 hover:text-blue-900 hover:underline"
                            >
                              {s.filename}
                            </a>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {s.firstCueStart}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {s.lastCueEnd}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {formatTimestamp(s.durationSec)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-mono">
                            {s.cueCount}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-center">
                            {s.monotonicityViolations === 0
                              ? (
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Valid
                                </span>
                              )
                              : (
                                <span
                                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                  title={`Max Overlap: ${
                                    s.monotonicityViolationMaxOverlap.toFixed(3)
                                  }s`}
                                >
                                  {s.monotonicityViolations} Violations
                                </span>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
