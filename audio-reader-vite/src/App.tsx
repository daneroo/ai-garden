import './App.css';

import { useState } from 'react';

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
  return (
    <VH100>
      <h3>Audio Reader (Vite)</h3>
      <ul>
        <li>[x] media selector</li>
        <li>[ ] audio player</li>
        <li>[ ] transcript | markup</li>
      </ul>
      <MediaSelector
        mediaChoices={mediaChoices}
        onMediaChange={handleMediaChange} // Optional handler
      />
      {/* Use the selectedMedia object directly */}
      <div>
        <h2>Selected Media Details</h2>
        <p>Audio: {selectedMedia.audioFile}</p>
        <p>Type: {selectedMedia.audioType}</p>
        <p>Transcript: {selectedMedia.transcriptFile}</p>
      </div>
      <pre style={{ flexGrow: 1, overflow: "auto", width: "100%" }}>
        Transcript
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
