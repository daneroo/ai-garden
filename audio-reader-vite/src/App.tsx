import './App.css';

import { useState } from 'react';

import {
  AudioPlayer,
  type TranscriptCue,
} from './components/audio-player';
import {
  type MediaChoice,
  MediaSelector,
} from './components/media-selector';
import { VH100 } from './components/VH100';
import { useAdjustedVH } from './hooks/useAdjustedVH';

const mediaChoices: MediaChoice[] = [
  {
    name: "The Road Not Taken",
    audioFile: "media/theroadnottaken.mp3",
    audioType: "audio/mp3",
    transcriptFile: "media/theroadnottaken.vtt",
    markupFile: "media/theroadnottaken.html",
  },
  {
    name: "The Road Not Taken (orig)",
    audioFile: "media/theroadnottaken.mp3",
    audioType: "audio/mp3",
    transcriptFile: "media/theroadnottaken.vtt",
    markupFile: "media/theroadnottaken-original.html",
  },
  {
    name: "Weapons",
    audioFile: "media/weapons.m4b",
    audioType: "audio/mp4",
    transcriptFile: "media/weapons.base.en.vtt",
    markupFile: "media/weapons.html",
  },
  {
    name: "Wrath",
    audioFile: "media/wrath.m4b",
    audioType: "audio/mp4",
    transcriptFile: "media/wrath.vtt",
    markupFile: "media/wrath.html",
  },
  {
    name: "Ruin",
    audioFile: "media/ruin.m4b",
    audioType: "audio/mp4",
    transcriptFile: "media/ruin.vtt",
    markupFile: "media/ruin.html",
  },
  {
    name: "The Blade Itself",
    audioFile: "media/thebladeitself.m4b",
    audioType: "audio/mp4",
    transcriptFile: "media/thebladeitself.vtt",
    markupFile: "media/thebladeitself.html",
  },
];

function App() {
  useAdjustedVH();
  // const { urlBarHeight } = useVHUrlBarHeight();

  const [selectedMedia, setSelectedMedia] = useState(mediaChoices[0]);
  const handleMediaChange = (media: MediaChoice) => {
    setSelectedMedia(media);
  };

  const [transcript, setTranscript] = useState<TranscriptCue[]>([]);

  const handleTranscriptChange = (cues: TranscriptCue[]) => {
    console.log(`Transcript Change: ${cues.length} cues`);
    setTranscript(cues);
  };
  return (
    <VH100>
      <h3>Audio Reader (Vite)</h3>
      <MediaSelector
        mediaChoices={mediaChoices}
        onMediaChange={handleMediaChange} // Optional handler
      />
      <AudioPlayer
        audioFile={selectedMedia.audioFile}
        audioType={selectedMedia.audioType}
        transcriptFile={selectedMedia.transcriptFile}
        onTranscriptChange={handleTranscriptChange} // Optional handler
      />
      {/* Use the selectedMedia object directly */}
      <div>
        <p>
          Selected Media Details <br />
          Audio: {selectedMedia.audioFile} ({selectedMedia.audioType}) <br />
          Transcript: {selectedMedia.transcriptFile}
        </p>
      </div>
      <pre style={{ flexGrow: 1, overflow: "auto", width: "100%" }}>
        Transcript
        {transcript.map((cue) => (
          <div key={cue.id}>
            {cue.startTime.toFixed(2)}s - {cue.text}
          </div>
        ))}
      </pre>
      <div>
        {/* Reload button  */}
        <button
          onClick={() => location.reload()}
          style={{ fontSize: "1.0rem", padding: "1rem", margin: "1rem" }}
        >
          Reload
        </button>
        {/* <code>URL Bar Height: {urlBarHeight}</code> */}
      </div>
    </VH100>
  );
}

export default App;
