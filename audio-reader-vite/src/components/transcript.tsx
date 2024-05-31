import { useEffect, useMemo, useRef } from "react";

import { useMedia } from "../hooks/useMedia";
import { TranscriptCue } from "../types";

export function Transcript() {
  const { transcript, setCurrentTime, activeCues } = useMedia();

  // Create a lookup object for activeCues by id
  const activeCuesLookup = useMemo(() => {
    const lookup: Record<string, boolean> = {};
    activeCues.forEach((cue: TranscriptCue) => {
      lookup[cue.id] = true;
    });
    return lookup;
  }, [activeCues]);

  // Create a ref for the active cue
  const activeCueRef = useRef<HTMLDivElement | null>(null);

  // Scroll the active cue into view when it changes
  useEffect(() => {
    if (activeCueRef.current) {
      activeCueRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeCuesLookup]);

  // memoize, otherwise it will re-render on every state change
  // even the values not destructured from useMedia()
  // i.e. currentTime!
  return useMemo(
    () => (
      <>
        <h5>Transcript</h5>

        {transcript.map((cue) => {
          const isActive = activeCuesLookup[cue.id];
          // the ref below might be triggered multiple times if there a more than one active cue
          // but the last reference will be the one that is scrolled into view
          return (
            <div
              key={cue.id}
              ref={isActive ? activeCueRef : null}
              className={`caption ${activeCuesLookup[cue.id] ? "current" : ""}`}
              onDoubleClick={() => {
                console.log("dbl click", cue);
                setCurrentTime(cue.startTime);
              }}
            >
              {formatTime(cue.startTime)} - {cue.text}
            </div>
          );
        })}
      </>
    ),
    [transcript, setCurrentTime, activeCuesLookup]
  );
}

const formatTime = (time: number, fractionDigits = 0) => {
  const minutes = Math.floor(time / 60);
  const pad = fractionDigits > 0 ? fractionDigits + 3 : 2;
  const seconds = (time % 60).toFixed(fractionDigits).padStart(pad, "0");
  return `${minutes}:${seconds}`;
};
