import React, {
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';

export type AudioPlayerProps = {
  audioFile: string;
  audioType: string;
  transcriptFile: string;
  onTranscriptChange?: (cues: TranscriptCue[]) => void;
};

export type TranscriptCue = {
  id: string;
  startTime: number;
  text: string;
  ref: RefObject<VTTCue>;
};
const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

export function AudioPlayer({
  audioFile,
  audioType,
  transcriptFile,
  onTranscriptChange: onTranscriptChange,
}: AudioPlayerProps) {
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLTrackElement>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptCue[]>([]);

  const sliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = newTime;
    }
  };

  useEffect(() => {
    // const audioPlayer = audioPlayerRef.current;
    // const track = trackRef.current?.track;

    console.log(`useEffect (${audioFile}, ${transcriptFile})`);

    function handleMetadataLoaded() {
      if (!audioPlayerRef.current) return;
      const duration = audioPlayerRef.current?.duration;
      console.log(`Audion Duration (loaded): ${duration}s`);
      setDuration(duration);
    }

    function handleTimeUpdate() {
      if (!audioPlayerRef.current) return;
      setCurrentTime(audioPlayerRef.current.currentTime);
    }

    function handleTrackLoad() {
      console.log(`Track loaded`);
      if (!trackRef.current) return;
      const track = trackRef.current.track;
      if (track.cues) {
        console.log(`Track cues: ${track.cues.length}`);
        //
        const cues = Array.from(track.cues) as VTTCue[];
        const cueRefs = cues.map(() => React.createRef<VTTCue>());
        setTranscript(
          cues.map((cue, index) => ({
            id: `${cue.startTime}-${cue.endTime}`,
            startTime: cue.startTime,
            text: cue.text,
            ref: cueRefs[index],
          }))
        );
      }
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.addEventListener(
        "loadedmetadata",
        handleMetadataLoaded
      );
      audioPlayerRef.current.ontimeupdate = handleTimeUpdate;
      audioPlayerRef.current.load(); // Reload the audio element to apply new sources
    }

    // Well this line cost me about 5 days of debugging
    // this is disabled by default, which won;t even trigger the loading of cues from the vtt file
    // needs to be set to "showing" or "hidden" to trigger cue loading on iPad/iPhone
    // console.log(`Track mode: ${trackRef.current.track.mode}`);
    if (trackRef.current) {
      trackRef.current.track.mode = "hidden"; // or "showing", as long as it does not remain "disabled"
      console.log(`Track mode: ${trackRef.current.track.mode}`);
      console.log(`Track adding event listener for load`);
      trackRef.current.addEventListener("load", handleTrackLoad);
    }

    // Clean up function
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.removeEventListener(
          "loadedmetadata",
          handleMetadataLoaded
        );
        audioPlayerRef.current.ontimeupdate = null;
      }
      if (trackRef.current) {
        trackRef.current.removeEventListener("load", handleTrackLoad);
      }
    };
  }, [audioFile, transcriptFile, onTranscriptChange]);

  useEffect(() => {
    if (onTranscriptChange) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);
  return (
    <div>
      {/* Media controls */}
      <audio ref={audioPlayerRef} controls>
        <source src={audioFile} type={audioType} />
        <track
          ref={trackRef}
          src={transcriptFile}
          kind="subtitles"
          srcLang="en"
          default
        />
      </audio>
      <div>
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          value={currentTime}
          max={duration}
          onChange={sliderChange}
        />
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
