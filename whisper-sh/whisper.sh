#!/usr/bin/env bash

OUTDIR="$HOME/Downloads/MacWhisperContent"
WHISPER_HOME="$HOME/Downloads/whisper.cpp"
WHISPER_EXEC="$WHISPER_HOME/main"
WHISPER_MODELS="$HOME/Downloads/whisper.cpp/models"

find "${OUTDIR}" -name \*.wav | sort | while IFS= read -r f; do
    wavfile="${f}"
    base=$(basename "${f}" .wav)
    whisper_pfx="${OUTDIR}/${base}"

    echo "# Processing ${base}"
    # Check if one of the output files exists
    if [ -f "${whisper_pfx}.srt" ] || [ -f "${whisper_pfx}.vtt" ] || [ -f "${whisper_pfx}.json" ]; then
        echo "  Output files already exist, skipping processing."
        continue
    fi

    echo "## Whispering ${base} to SRT/VTT/JSON"
    echo
    time ${WHISPER_EXEC} -f "${wavfile}" -m ${WHISPER_MODELS}/ggml-tiny.en.bin --output-json --output-srt --output-vtt -of "${whisper_pfx}"
done
