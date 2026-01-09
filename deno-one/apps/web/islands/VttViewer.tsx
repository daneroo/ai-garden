import { useState } from "preact/hooks";
import { type VttCue } from "@deno-one/vtt";

interface VttViewerProps {
  cues: VttCue[];
}

export default function VttViewer({ cues }: VttViewerProps) {
  const [limit, setLimit] = useState(100);
  const visibleCues = cues.slice(0, limit);

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">
          Transcript{" "}
          <span class="text-sm font-normal text-gray-500 ml-2">
            ({visibleCues.length} of {cues.length})
          </span>
        </h2>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ul class="divide-y divide-gray-100">
          {visibleCues.map((cue, idx) => (
            <li
              key={idx}
              class="p-4 hover:bg-gray-50 transition-colors flex gap-4"
            >
              <div class="flex-shrink-0 w-32 font-mono text-xs text-gray-500 pt-1 select-none">
                <div>{cue.startTime}</div>
                <div class="opacity-50">{cue.endTime}</div>
              </div>
              <div class="text-gray-800 text-base leading-relaxed">
                {cue.text}
              </div>
            </li>
          ))}
        </ul>
        {limit < cues.length && (
          <div class="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => setLimit(limit + 500)}
              class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Load More (+500)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
