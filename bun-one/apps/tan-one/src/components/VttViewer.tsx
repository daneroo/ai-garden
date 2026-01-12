import { useMemo, useState } from "react";
import { vttTimeToSeconds, type VttCue } from "@bun-one/vtt";

interface VttViewerProps {
  cues: VttCue[];
}

// Check if cue at index i violates monotonicity (starts before previous cue ends)
function isViolation(cues: VttCue[], i: number): boolean {
  if (i === 0) return false;
  const prevEnd = vttTimeToSeconds(cues[i - 1]!.endTime);
  const currStart = vttTimeToSeconds(cues[i]!.startTime);
  return currStart < prevEnd;
}

export function VttViewer({ cues }: VttViewerProps) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          Transcript{" "}
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({visibleCues.length} of {filteredCues.length}
            {showOnlyViolations ? ` violations` : ` total`})
          </span>
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOnlyViolations}
            onChange={(e) => {
              setShowOnlyViolations(e.target.checked);
              setLimit(100); // Reset pagination when toggling
            }}
            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
          />
          Show only violations ({violationIndices.size})
        </label>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <ul className="divide-y divide-slate-700">
          {visibleCues.map((cue, idx) => {
            // Find the original index to check if it's a violation
            const originalIndex = showOnlyViolations ? cues.indexOf(cue) : idx;
            const hasViolation = violationIndices.has(originalIndex);
            // Is this cue a predecessor to a violation? (its end time is the problem)
            const isPredecessor = violationIndices.has(originalIndex + 1);

            // Calculate overlap duration
            let overlapSec = 0;
            if (hasViolation && originalIndex > 0) {
              const prevEnd = vttTimeToSeconds(
                cues[originalIndex - 1]!.endTime,
              );
              const currStart = vttTimeToSeconds(cue.startTime);
              overlapSec = prevEnd - currStart;
            } else if (isPredecessor) {
              const currEnd = vttTimeToSeconds(cue.endTime);
              const nextStart = vttTimeToSeconds(
                cues[originalIndex + 1]!.startTime,
              );
              overlapSec = currEnd - nextStart;
            }

            return (
              <li
                key={originalIndex}
                className={`p-4 hover:bg-slate-700/50 transition-colors flex gap-4 ${
                  hasViolation || isPredecessor ? "bg-red-900/30" : ""
                }`}
              >
                <div className="flex-shrink-0 font-mono text-xs text-gray-400 pt-1 select-none whitespace-nowrap">
                  <span
                    className={hasViolation ? "text-red-400 font-semibold" : ""}
                  >
                    {cue.startTime}
                  </span>
                  {" – "}
                  <span
                    className={
                      isPredecessor ? "text-red-400 font-semibold" : ""
                    }
                  >
                    {cue.endTime}
                  </span>
                </div>
                <div className="text-gray-200 text-sm leading-relaxed flex-1">
                  {cue.text}
                </div>
                {(hasViolation || isPredecessor) && (
                  <div className="flex-shrink-0 text-xs text-red-400 font-medium pt-1">
                    ⚠ overlap {overlapSec.toFixed(3)}s
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {limit < filteredCues.length && (
          <div className="p-4 bg-slate-700/50 border-t border-slate-700 text-center">
            <button
              type="button"
              onClick={() => setLimit(limit + 500)}
              className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-sm font-medium text-gray-200 hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              Load More (+500)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
