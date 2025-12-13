/**
 * Audio utilities for whisper-bench
 */

/**
 * Get the duration of an audio file in seconds using ffprobe
 * @param audioFile - Path to the audio file
 * @returns Duration in seconds as a float, or -1 if file doesn't exist or can't be read
 */
export async function getAudioFileDuration(audioFile: string): Promise<number> {
  // ffprobe command parameters:
  // -v error           : Only show errors, no other output
  // -show_entries      : Show specific entries from input
  // format=duration    : Get duration from format section
  // -of               : Output format
  // default=          : Default format settings
  // noprint_wrappers=1: Don't print section headers
  // nokey=1           : Don't print key names
  const cmd = new Deno.Command("ffprobe", {
    args: [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      audioFile,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  try {
    const { code, stdout } = await cmd.output();
    if (code !== 0) {
      console.warn(`Could not get duration of ${audioFile}`);
      return -1;
    }
    const output = new TextDecoder().decode(stdout).trim();
    return parseFloat(output);
  } catch {
    console.warn(`Could not get duration of ${audioFile}`);
    return -1;
  }
}
