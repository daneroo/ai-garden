import {
  execAsync,
  getAudioFileDuration,
  whisperTranscribe,
} from "./whisper.mjs";
import { basename } from "node:path";

// If this module is the main module, then call the main function
// Note: In Deno we would simply use: if (import.meta.main)
// But Node.js requires checking the URL against argv[1]
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  await main();
}

async function main() {
  const tmpVttFile = "coco.vtt";
  for (const requestedDuration of [1800, 3600, 7200]) {
    await execAsync("rm -f " + tmpVttFile);

    const { wav, duration, elapsed } = await whisperTranscribe(
      "/Users/daniel/Downloads/WhisperCPPContent/Terry Pratchett - Discworld 09 - Eric.wav",
      tmpVttFile,
      {
        MODEL_SHORTNAME: "base.en",
        DURATION: requestedDuration,
        DRYRUN: false,
      }
    );
    // seconds per hour of audio
    const cost = (elapsed / (duration / 3600)).toFixed(2); // seconds per hour of audio
    const speedup = (duration / elapsed).toFixed(2); // audio
    // | Hostname | Architecture  | Model   | Threads | Duration (ms) | Execution Time (s) |
    // |----------|---------------|---------|--------:|--------------:|-------------------:|
    //  duration per second
    console.log("|-----|-----|-----|-----|-----|");

    console.log(
      `| ${basename(wav)} | ${duration}s | ${elapsed.toFixed(
        2
      )}s | ${cost}s/h | ${speedup}x |`
    );
  }
}
