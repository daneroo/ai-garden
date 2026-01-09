import { formatTimestamp } from "@deno-one/vtt";

export default function Home() {
  const time = formatTimestamp(3661.5);

  return (
    <div class="p-8 font-sans max-w-screen-md mx-auto">
      <h1 class="text-3xl font-bold mb-4">Fresh 2.0 Native (No Vite)</h1>
      <p class="mb-4">This builds perfectly in Deno 2 workspaces.</p>
      <p class="mb-4 text-gray-600 italic">Native Mode (No Vite) = SSR Only.</p>

      <div class="p-4 bg-green-100 rounded border border-green-300">
        <strong>Shared Library Output:</strong> {time}
      </div>
    </div>
  );
}
