# Whisper Transcription

## Configuration

- BASEDIR (input for m4b's): /Volumes/Space/Reading/audiobooks/Terry Pratchett - Discworld/Terry Pratchett - Discworld 09 - Eric/
- MODEL_SHORTNAME: base.en
- OUTDIR: /Users/daniel/Downloads/WhisperCPPContent
- SCRIPT_DIR: /Users/daniel/Code/iMetrical/ai-garden/whisper-sh
- WHISPER_HOME: /Users/daniel/Code/iMetrical/ai-garden/external-repos/whisper.cpp
- WHISPER_EXEC: /Users/daniel/Code/iMetrical/ai-garden/external-repos/whisper.cpp/build/bin/whisper-cli

## Processing Terry Pratchett - Discworld 09 - Eric
### Converting to WAV file

- m4b: Terry Pratchett - Discworld 09 - Eric.m4b
- duration: 14326.443991 seconds
- wav: Terry Pratchett - Discworld 09 - Eric.wav                                                                                                                                                 .wav files already exist and match expected pattern. Skipping command:                                                                                                                         ffmpeg -y -hide_banner -loglevel panic -i "/Volumes/Space/Reading/audiobooks/Terry Pratchett - Discworld/Terry Pratchett - Discworld 09 - Eric/Terry Pratchett - Discworld 09 - Eric.m4b" -ar 16000 -ac 1 -c:a pcm_s16le -af "asetpts=N/SR/TB" -reset_timestamps 1 "/Users/daniel/Downloads/WhisperCPPContent/Terry Pratchett - Discworld 09 - Eric.wav"

WAV sanity check

- M4B duration: 14326.443991 seconds
  - Terry Pratchett - Discworld 09 - Eric.wav duration: 14326.455188 seconds
- WAV duration total: 14326.455188 seconds
- [✓] Durations match

### Transcribing to VTT

- command:
  /Users/daniel/Code/iMetrical/ai-garden/external-repos/whisper.cpp/build/bin/whisper-cli -t 4 --print-progress -f "/Users/daniel/Downloads/WhisperCPPContent/Terry Pratchett - Discworld 09 - Eric.wav" -m "/Users/daniel/Code/iMetrical/ai-garden/external-repos/whisper.cpp/models/ggml-base.en.bin" --output-vtt -of "/Users/daniel/Downloads/WhisperCPPContent/Terry Pratchett - Discworld 09 - Eric"
- [100%] [03:58:40.320 --> 03:58:47.040]   Thanks for listening. Audible hopes you've enjoyed this program.
- elapsed: 290.35s
- cost: 72.96s/h of audio
- speedup: 49.34x realtime

VTT sanity check

- vtt[last cue]: Terry Pratchett - Discworld 09 - Eric.vtt
  - startTime: 03:58:40.320
  - endTime: 03:58:47.040
  - text: Thanks for listening. Audible hopes you've enjoyed this program.
- WAV duration: 14326.455188 seconds
- last cue endTime (s): 14327.04s
- last cue is in range: true
- [✓] last cue endTime (s) within 1s of WAV duration (s)
- [✓] VTT validation passed