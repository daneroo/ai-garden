#!/usr/bin/env bash

OUTDIR="$HOME/Downloads/MacWhisperContent"

# Ensure a file is provided as argument
if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_m4b_file>"
    exit 1
fi

m4bfile="$1"
base=$(basename "${m4bfile}" .m4b)
wavfile="${OUTDIR}/${base}.wav"

# Convert to wav
echo "Converting ${m4bfile} to wav ${wavfile}"
ffmpeg -y -hide_banner -loglevel panic -i "${m4bfile}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavfile}"
