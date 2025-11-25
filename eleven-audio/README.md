# Eleven Reader - Audio Book Production

This is the process to capture the audio for an epub book using ElevenReader audio output capture

## TODO

- Automate the capture (Docker/Just/Gum)
  - Redirect the output to local directory

## Calibre Trim epub

**Working Dir**: `/Volumes/Space/Staging/ElevenReader-Trimmed-EPub`

- Open original epub in calibre (makes a copy)
- Edit in Calibre
  - Leave a title Page; make the title/author readable at the beginning
  - Remove unwanted "chapters"
  - Remove unreferenced images (report)
  - Save and upload to Eleven Reader
  - Convention rename to *title*-Trimmed.epub

## Capture Eleven Reader audio

**Working Dir**: `/Volumes/Space/Staging/ElevenReader-Captured-Audio`

- Upload the *X*-Trimmed.epu to ElevenReader
- Record playback to .mp3 (see below)
- Final Trim of mp3 (remove ending) - `open -a Audacity`

```bash
docker rm -f audio_ripper 2>/dev/null
docker run -d \
  --name audio_ripper \
  --security-opt seccomp=unconfined \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --shm-size="1gb" \
  linuxserver/webtop:ubuntu-xfce  

# Open Desktop (webtop)
open http://localhost:3000

# install packages
docker exec -it -u 0 audio_ripper bash -c "apt update && apt install -y ffmpeg lame pulseaudio-utils"

# confirm audion devices
docker exec -u abc audio_ripper pactl list short sources
## Expected output - output monitor is the one we will use
## 1       output.monitor  module-null-sink.c      s16le 2ch 48000Hz       RUNNING
## 2       input.monitor   module-null-sink.c      s16le 2ch 44100Hz       SUSPENDED

# Verify the PulseAudio Socket Path
docker exec -u abc audio_ripper pactl info | grep "Server String"
## Expected output - used with ENV VAR "PULSE_SERVER"
## Server String: /defaults/native

# Manual: Setup the audio playbacK
## - Open Web Browser (Chromium) - Browser in Browser
## - Auth to ElevenReader 
##   - Select Book - Position playback
##   - Mute the "Outer" Browser tab (optional)
open http://localhost:3000/

# Start the capture listener
## TODO: Use a timestamp in the filename?
## Keep this running until capture is complete
## Ctrl-C to exit
docker exec -it -u abc -e PULSE_SERVER=unix:/defaults/native audio_ripper ffmpeg -f pulse -i output.monitor -ac 2 -y /config/recording.mp3
## ...
## size=     100kB time=00:00:07.03 bitrate= 116.9kbits/s speed=1.09x

# copy out the file
docker cp audio_ripper:/config/recording.mp3 .
# check duration
ffmpeg -i ./recording.mp3 2>&1 | grep Duration
```

## Set Chapter Marks (Whisper+Audiobookshelf)

- use whisper to get `.vtt file` (after encoding to `.m4b`)
- edit chapter marks in Audiobookshelf
