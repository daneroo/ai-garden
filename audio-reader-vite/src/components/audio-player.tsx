import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useMedia } from '../hooks/useMedia';
import type { TranscriptCue } from '../types';

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  // const seconds = Math.floor(time % 60);
  // return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  const seconds = (time % 60).toFixed(1).padStart(4, "0");
  return `${minutes}:${seconds}`;
};

export function AudioPlayer() {
  const { selectedMedia, setTranscript, currentTime, setCurrentTime } =
    useMedia();
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

    console.log(
      `useEffect (${selectedMedia.audioFile}, ${selectedMedia.transcriptFile})`
    );

    const audioElement = audioPlayerRef.current;

    function handleMetadataLoaded() {
      if (!audioElement) return;
      const duration = audioElement.duration;
      console.log(`Audio Duration (loaded): ${duration}s`);
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
        const cues = Array.from(track.cues) as VTTCue[];
        const newTranscript: TranscriptCue[] = cues.map((cue) => ({
          id: `${cue.startTime}-${cue.endTime}`,
          startTime: cue.startTime,
          text: cue.text,
        }));
        setTranscript(newTranscript);
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
      }
    };
  }, [selectedMedia, setTranscript]);

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
