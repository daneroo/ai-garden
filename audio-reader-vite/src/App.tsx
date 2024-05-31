import "./App.css";

import { AudioPlayer } from "./components/audio-player";
import { Markup } from "./components/markup";
import { MediaSelector } from "./components/media-selector";
import { Transcript } from "./components/transcript";
import { VH100 } from "./components/VH100";
import { MediaProvider } from "./contexts/media-context";
import { useAdjustedVH } from "./hooks/useAdjustedVH";
import type { MediaChoice } from "./types";

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
    transcriptFile: "media/wrath.base.en.vtt",
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

  return (
    <MediaProvider mediaChoices={mediaChoices}>
      <VH100>
        <h3>Audio Reader (Vite)</h3>
        <MediaSelector />
        <AudioPlayer />
        {/* Two-Column Layout for Transcript and HTML Content */}
        <div
          style={{
            overflowY: "auto", // required for children to get proper height
            flexGrow: 1, // Outer container grows to fill available space
            display: "flex", // Outer container uses flexbox layout
            gap: "1rem", // Gap between the inner columns
            justifyContent: "space-between", // Space between the inner columns
            padding: "1rem", // Padding for the outer container
          }}
        >
          {/* Transcript Column */}
          <div
            style={{
              width: "50%",
              // flexBasis: "40%", // Take up to 40% of the container's width
              // maxWidth: "40%", // Ensure it doesn't exceed 40% of the container's width
              // flexGrow: 1, // Inner column grows to fill the available space equally
              overflowY: "auto", // Adds vertical scrolling to the inner column if needed
              overflowX: "auto", // Adds horizontal scrolling to the pre tag if needed
            }}
          >
            {/* This is where the transcript goes */}
            <Transcript />
          </div>
          {/* Markup Content Column */}
          <div
            style={{
              width: "50%",
              // flexGrow: 1, // Inner column grows to fill the available space equally
              overflowY: "auto", // Adds vertical scrolling to the inner column if needed
            }}
          >
            {/* This is where the markup goes */}
            <Markup />
          </div>
        </div>
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
    </MediaProvider>
  );
}

export default App;
