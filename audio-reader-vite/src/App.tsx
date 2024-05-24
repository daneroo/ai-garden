import "./App.css";

import { useAdjustedVH } from "./hooks/useAdjustedVH";

function App() {
  useAdjustedVH();
  // const { urlBarHeight } = useVHUrlBarHeight();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "calc(var(--vh) * 100)",
        justifyContent: "space-between",
        gap: "1.2rem",
      }}
    >
      {/* <h1>Audio Reader (Vite)</h1> */}
      <div>Audio Reader (Vite)</div>
      <ul>
        <li>media selector</li>
        <li>audio player</li>
        <li>transcript | markup</li>
      </ul>
      <div style={{ width: "90vw" }}>something wide enough</div>
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
    </div>
  );
}

export default App;
