import { Timer } from "@bun-one/timer";
import "../index.css";

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/80 to-secondary/80 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-primary-content mb-8">
        Vite + Tailwind + Shared Components
      </h1>

      <div className="bg-base-100/90 backdrop-blur rounded-2xl shadow-xl p-8 max-w-md">
        <h2 className="text-xl font-semibold text-base-content mb-4">
          Timer from @bun-one/timer
        </h2>
        <p className="text-base-content/70 text-sm mb-4">
          Visual test: Timer should have white bg, rounded corners, shadow. Time
          should be red (running) or green (complete).
        </p>
        <Timer initialSeconds={10} />
      </div>

      <div className="mt-8 flex gap-4">
        <button className="btn btn-primary">DaisyUI Button</button>
        <button className="btn btn-secondary">Secondary</button>
      </div>
    </div>
  );
}

export default Home;
