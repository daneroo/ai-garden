import { useMemo } from "react";

import { useMedia } from "../hooks/useMedia";

export function Transcript() {
  const { transcript, setCurrentTime, activeCues } = useMedia();
  // memoize, otherwise it will re-render on every state change
  // even the values not destructured from useMedia()
  // i.e. currentTime!
  return useMemo(
    () => (
      <>
        <h5>Transcript</h5>

        {transcript.map((cue) => (
          <div
            key={cue.id}
            className={`caption ${
              activeCues.some((activeCue) => activeCue.id === cue.id)
                ? "current"
                : ""
            }`}
            // className={"caption current"}
            onDoubleClick={() => {
              console.log("dbl click", cue);
              setCurrentTime(cue.startTime);
            }}
          >
            {cue.startTime.toFixed(2)}s - {cue.text}
          </div>
        ))}
      </>
    ),
    [transcript, activeCues, setCurrentTime]
  );
}
