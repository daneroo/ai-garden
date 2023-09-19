#!/usr/bin/env bash

convert_to_wav() {
    local m4b="$1"
    local wav="$2"
    if [[ -f "${wav}" ]]; then
        echo ".wav already exists. Skipping conversion..."
    else
        echo "Converting ${m4b} to ${wav} ..."
        ffmpeg -y -hide_banner -loglevel panic -i "${m4b}" -ar 16000 -ac 1 -c:a pcm_s16le "${wav}"
    fi
}

whisper_transcribe() {
    local wav="$1"
    local prefix="$2"
    if [ -f "${prefix}.srt" ] || [ -f "${prefix}.vtt" ] || [ -f "${prefix}.json" ]; then
        echo "Transcription files already exist, skipping processing."
    else
        echo "Launching whisper transcribe..."
        time ${WHISPER_EXEC} -f "${wav}" -m ${WHISPER_MODELS}/ggml-tiny.en.bin --output-json --output-srt --output-vtt -of "${prefix}"
    fi
}

# Main
if [ "$#" -ne 1 ]; then
    echo "Usage: ./whisper.sh <base_directory>"
    exit 1
fi

BASEDIR="$1"

# Check if BASEDIR is a directory
if [[ ! -d "${BASEDIR}" ]]; then
    echo "Error: ${BASEDIR} is not a directory or does not exist."
    exit 1
fi

OUTDIR="$HOME/Downloads/MacWhisperContent"
WHISPER_HOME="$HOME/Downloads/whisper.cpp"
WHISPER_EXEC="$WHISPER_HOME/main"
WHISPER_MODELS="$HOME/Downloads/whisper.cpp/models"

echo "# Scanning for .m4b in ${BASEDIR}"

# Scan BASEDIR for m4b files
find "${BASEDIR}" -name \*.m4b | sort | while IFS= read -r m4b; do
    BOOKBASE=$(basename "${m4b}" .m4b)
    WAV_FILE="${OUTDIR}/${BOOKBASE}.wav"
    WHISPER_PFX="${OUTDIR}/${BOOKBASE}"

    echo ""
    echo "## Processing ${BOOKBASE}"
    echo "### Converting to WAV file"
    convert_to_wav "${m4b}" "${WAV_FILE}"
    echo "### Transcribing to SRT/VTT/JSON"
    whisper_transcribe "${WAV_FILE}" "${WHISPER_PFX}"
done
