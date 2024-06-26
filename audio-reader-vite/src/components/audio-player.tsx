import React, { useEffect, useRef, useState } from "react";

import { useMedia } from "../hooks/useMedia";
import type { TranscriptCue } from "../types";

const formatTime = (time: number, fractionDigits = 0) => {
  const minutes = Math.floor(time / 60);
  const pad = fractionDigits > 0 ? fractionDigits + 3 : 2;
  const seconds = (time % 60).toFixed(fractionDigits).padStart(pad, "0");
  return `${minutes}:${seconds}`;
};

export function AudioPlayer() {
  const {
    selectedMedia,
    setTranscript,
    currentTime,
    setCurrentTime,
    setActiveCues,
  } = useMedia();
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLTrackElement>(null);
  const isTimeUpdateFromAudio = useRef(false); // Ref to track if the time update is from the audio element, and prevent feedback loop

  const [duration, setDuration] = useState(0);

  const sliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  // handle audio element events
  useEffect(() => {
    if (!selectedMedia) return;

    const audioElement = audioPlayerRef.current;

    function handleMetadataLoaded() {
      if (!audioElement) return;
      const duration = audioElement.duration;
      console.log(
        `Audio Duration for ${selectedMedia.audioFile}: ${duration}s (loaded)`
      );
      setDuration(duration);
    }

    function handleTimeUpdate() {
      if (!audioElement) return;
      isTimeUpdateFromAudio.current = true; // This update is from the audio element
      setCurrentTime(audioElement.currentTime);
    }

    if (audioElement) {
      audioElement.onloadedmetadata = handleMetadataLoaded;
      audioElement.ontimeupdate = handleTimeUpdate;
      audioElement.load(); // Reload the audio element to apply new sources
    }

    return () => {
      if (audioElement) {
        audioElement.onloadedmetadata = null;
        audioElement.ontimeupdate = null;
      }
    };
  }, [selectedMedia, setCurrentTime, setDuration]);

  // handle track element events
  useEffect(() => {
    if (!selectedMedia) return;

    const trackElement = trackRef.current;

    function handleTrackLoad() {
      console.log(`Track loaded`);
      if (!trackElement) return;
      const track = trackElement.track;
      if (track.cues) {
        console.log(`Track cues: ${track.cues.length}`);
        const newTranscript = fromTextTrackCueList(track.cues);
        setTranscript(newTranscript);

        track.oncuechange = () => {
          if (!track.activeCues) return;
          const activeCues = fromTextTrackCueList(track.activeCues);
          // console.log(
          //   `Active cues: ${activeCues.length} ${JSON.stringify(activeCues)}`
          // );
          setActiveCues(activeCues);
        };
      }
    }

    if (trackElement) {
      trackElement.track.mode = "hidden"; // or 'showing', as long as it does not remain 'disabled'
      console.log(`Track mode: ${trackElement.track.mode}`);
      console.log(`Track adding event listener for load`);
      trackElement.onload = handleTrackLoad;
    }

    return () => {
      if (trackElement) {
        trackElement.onload = null;
        const track = trackElement.track;
        if (track) {
          track.oncuechange = null;
        }
      }
      setTranscript([]);
    };
  }, [selectedMedia, setTranscript, setActiveCues]);

  // Sync the context currentTime with the audio element's currentTime when context currentTime changes
  useEffect(() => {
    if (audioPlayerRef.current) {
      if (isTimeUpdateFromAudio.current) {
        // console.log("Would have caused feedback loop");
        isTimeUpdateFromAudio.current = false; // Reset the flag after syncing
        return;
      }
      if (Math.abs(audioPlayerRef.current.currentTime - currentTime) > 0.1) {
        audioPlayerRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime]);

  return (
    <div>
      {/* Media controls */}
      <audio ref={audioPlayerRef} controls>
        <source
          src={selectedMedia?.audioFile}
          type={selectedMedia?.audioType}
        />
        <track
          ref={trackRef}
          src={selectedMedia?.transcriptFile}
          kind="subtitles"
          srcLang="en"
          default
        />
      </audio>
      <div>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          value={currentTime}
          max={duration}
          onChange={sliderChange}
        />
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatTime(duration)}
        </span>{" "}
      </div>
    </div>
  );
}

function fromTextTrackCueList(ttcl: TextTrackCueList): TranscriptCue[] {
  const cues = Array.from(ttcl) as VTTCue[];
  return cues.map((cue) => ({
    id: `${cue.startTime}-${cue.endTime}`,
    startTime: cue.startTime,
    text: cue.text,
  }));
}
