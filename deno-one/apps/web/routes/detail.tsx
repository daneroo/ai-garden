import { formatTimestamp, type VttCue, type VttSummary } from "@deno-one/vtt";
import VttViewer from "../islands/VttViewer.tsx";

interface DetailProps {
  summary: VttSummary;
  filename: string;
  cues: VttCue[];
}

export default function Detail(props: DetailProps) {
  const { summary: s, filename, cues } = props;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{filename} - Prosody</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <div class="p-8 font-sans">
          <div class="max-w-screen-xl mx-auto space-y-8">
            {/* Header / Nav */}
            <div class="flex items-center justify-between">
              <a
                href="/"
                class="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
              >
                &larr; Back to Dashboard
              </a>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h1 class="text-xl font-bold text-gray-900 font-mono break-all">
                  {filename}
                </h1>
                <div class="flex items-center gap-2">
                  {s.monotonicityViolations === 0
                    ? (
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Valid
                      </span>
                    )
                    : (
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {s.monotonicityViolations} Violations
                      </span>
                    )}
                </div>
              </div>

              <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div class="text-sm text-gray-500 mb-1">Duration</div>
                  <div class="text-lg font-mono font-semibold text-gray-900">
                    {formatTimestamp(s.durationSec)}
                  </div>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div class="text-sm text-gray-500 mb-1">Cue Count</div>
                  <div class="text-lg font-mono font-semibold text-gray-900">
                    {s.cueCount}
                  </div>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div class="text-sm text-gray-500 mb-1">Start Time</div>
                  <div class="text-lg font-mono font-semibold text-gray-900">
                    {s.firstCueStart}
                  </div>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div class="text-sm text-gray-500 mb-1">End Time</div>
                  <div class="text-lg font-mono font-semibold text-gray-900">
                    {s.lastCueEnd}
                  </div>
                </div>
              </div>

              {s.monotonicityViolations > 0 && (
                <div class="px-6 pb-6">
                  <div class="p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 text-sm">
                    <strong class="font-semibold block mb-1">
                      Monotonicity Issues Detected
                    </strong>
                    max overlap: {s.monotonicityViolationMaxOverlap.toFixed(3)}s
                  </div>
                </div>
              )}
            </div>

            {/* Content Section (Preact Island) */}
            <VttViewer cues={cues} />
          </div>
        </div>
      </body>
    </html>
  );
}
