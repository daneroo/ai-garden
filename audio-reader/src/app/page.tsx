import { AudioReader } from "@/components/audio-reader";

export default function Home() {
  return (
    <main className="flex flex-col justify-between h-full">
      <div className="flex items-center justify-center">Header</div>

      <div className="flex-grow">
        <AudioReader />
      </div>

      <div className="flex items-center justify-center">Footer</div>
    </main>
  );
}
