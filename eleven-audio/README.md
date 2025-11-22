# Eleven Reader - Audio Book Production

## Failed experiments
- Using Preview.app to delete pages, bloats pdf output (rasterized)
- QPDF and PDFTK: destryed the TOC (Bookmarks)

## Trim epub

- convert epu to pdf with calibre

- extract only pages to narrate
  - In this case delete pages 5-6, 9-15, 517-end

```bash
brew install mupdf-tools
mutool merge -o trim.pdf copy.pdf 1-4,7-8,16-516

# or
brew install cpdf
cpdf "copy.pdf" 1-4,7-8,16-516 -o "trim.pdf"
```

## Grab Eleven Reader audio

```bash
docker rm -f audio_ripper 2>/dev/null
docker run -d \
  --name audio_ripper \
  --security-opt seccomp=unconfined \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --shm-size="1gb" \
  linuxserver/webtop:ubuntu-xfce  
  
# install packages
docker exec -it -u 0 audio_ripper bash -c "apt update && apt install -y ffmpeg lame pulseaudio-utils"

# confirm audion devices
docker exec -u abc audio_ripper pactl list short sources
## 1       output.monitor  module-null-sink.c      s16le 2ch 48000Hz       RUNNING
## 2       input.monitor   module-null-sink.c      s16le 2ch 44100Hz       SUSPENDED

# Verify the PulseAudio Socket Path
docker exec -u abc audio_ripper pactl info | grep "Server String"
## Server String: /defaults/native

# Start the listener - Use a timestamp for the filename
docker exec -it -u abc -e PULSE_SERVER=unix:/defaults/native audio_ripper ffmpeg -f pulse -i output.monitor -ac 2 -y /config/recording.mp3
## ...
## size=     100kB time=00:00:07.03 bitrate= 116.9kbits/s speed=1.09x

# in another shell - monitor the output file
docker exec -it -u abc audio_ripper bash
cd /config
ffmpeg -i ./recording.mp3 2>&1 | grep Duration

# copy out the file
docker cp audio_ripper:/config/recording.mp3 .
# check duration
ffmpeg -i ./recording.mp3 2>&1 | grep Duration







```
