import { useMemo, useState } from "preact/hooks";

interface VttCue {
  startTime: string;
  endTime: string;
  text: string;
}

// Inline to avoid importing @prosidio/vtt which pulls in node:fs/promises
// Handles both MM:SS.mmm and HH:MM:SS.mmm formats
function vttTimeToSeconds(time: string): number {
  const parts = time.split(":");
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 +
      parseFloat(seconds);
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return parseInt(minutes) * 60 + parseFloat(seconds);
  }
  return parseFloat(time);
}

interface VttViewerProps {
  cues: VttCue[];
}

// Check if cue at index i violates monotonicity (starts before previous cue ends)
function isViolation(cues: VttCue[], i: number): boolean {
  if (i === 0) return false;
  const prevEnd = vttTimeToSeconds(cues[i - 1].endTime);
  const currStart = vttTimeToSeconds(cues[i].startTime);
  return currStart < prevEnd;
}

export default function VttViewer({ cues }: VttViewerProps) {
  const [limit, setLimit] = useState(100);
  const [showOnlyViolations, setShowOnlyViolations] = useState(false);

  // Pre-compute which cues are violations
  const violationIndices = useMemo(() => {
    const indices = new Set<number>();
    for (let i = 1; i < cues.length; i++) {
      if (isViolation(cues, i)) {
        indices.add(i);
      }
    }
    return indices;
  }, [cues]);

  // Filter cues based on checkbox - include context (previous cue) for each violation
  const filteredCues = useMemo(() => {
    if (!showOnlyViolations) return cues;
    // Include both the violating cue AND its predecessor for context
    const indicesToShow = new Set<number>();
    for (const i of violationIndices) {
      indicesToShow.add(i - 1); // Previous cue (shows why there's overlap)
      indicesToShow.add(i); // Violating cue
    }
    return cues.filter((_, i) => indicesToShow.has(i));
  }, [cues, showOnlyViolations, violationIndices]);

  const visibleCues = filteredCues.slice(0, limit);

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">
          Transcript{" "}
          <span class="text-sm font-normal text-gray-500 ml-2">
            ({visibleCues.length} of {filteredCues.length}
            {showOnlyViolations ? ` violations` : ` total`})
          </span>
        </h2>
        <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOnlyViolations}
            onChange={(e) => {
              setShowOnlyViolations((e.target as HTMLInputElement).checked);
              setLimit(100); // Reset pagination when toggling
            }}
            class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show only violations ({violationIndices.size})
        </label>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ul class="divide-y divide-gray-100">
          {visibleCues.map((cue, idx) => {
            // Find the original index to check if it's a violation
            const originalIndex = showOnlyViolations ? cues.indexOf(cue) : idx;
            const hasViolation = violationIndices.has(originalIndex);
            // Is this cue a predecessor to a violation? (its end time is the problem)
            const isPredecessor = violationIndices.has(originalIndex + 1);

            // Calculate overlap duration
            let overlapSec = 0;
            if (hasViolation && originalIndex > 0) {
              const prevEnd = vttTimeToSeconds(cues[originalIndex - 1].endTime);
              const currStart = vttTimeToSeconds(cue.startTime);
              overlapSec = prevEnd - currStart;
            } else if (isPredecessor) {
              const currEnd = vttTimeToSeconds(cue.endTime);
              const nextStart = vttTimeToSeconds(
                cues[originalIndex + 1].startTime,
              );
              overlapSec = currEnd - nextStart;
            }

            return (
              <li
                key={originalIndex}
                class={`p-4 hover:bg-gray-50 transition-colors flex gap-4 ${
                  hasViolation || isPredecessor ? "bg-red-50" : ""
                }`}
              >
                <div class="flex-shrink-0 font-mono text-xs text-gray-500 pt-1 select-none whitespace-nowrap">
                  <span
                    class={hasViolation ? "text-red-600 font-semibold" : ""}
                  >
                    {cue.startTime}
                  </span>
                  {" – "}
                  <span
                    class={isPredecessor ? "text-red-600 font-semibold" : ""}
                  >
                    {cue.endTime}
                  </span>
                </div>
                <div class="text-gray-800 text-base leading-relaxed">
                  {cue.text}
                </div>
                {(hasViolation || isPredecessor) && (
                  <div class="flex-shrink-0 text-xs text-red-600 font-medium pt-1">
                    ⚠ overlap {overlapSec.toFixed(3)}s
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {limit < filteredCues.length && (
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
