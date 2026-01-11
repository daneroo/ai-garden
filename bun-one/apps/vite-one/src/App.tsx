import { Timer } from "@bun-one/timer";
import "./App.css";

function App() {
  return (
    <>
      <h1>Vite + Shared Components</h1>
      <div className="card">
        <h2>Timer from @bun-one/timer</h2>
        <Timer initialSeconds={120} />
      </div>
    </>
  );
}

export default App;
