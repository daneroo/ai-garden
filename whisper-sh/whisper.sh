#!/usr/bin/env bash

OUTDIR="$HOME/Downloads/WhisperCPPContent"
# reliably get this script's directory as an absolute path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WHISPER_HOME="${SCRIPT_DIR}/../external-repos/whisper.cpp"
WHISPER_HOME="$( cd "${SCRIPT_DIR}/../external-repos/whisper.cpp" && pwd )"
WHISPER_EXEC="$WHISPER_HOME/main"
WHISPER_MODELS="${WHISPER_HOME}/models"

# Script parameter: BASEDIR
BASEDIR="$1"

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


# Check if BASEDIR is a directory
if [[ ! -d "${BASEDIR}" ]]; then
    echo "Error: ${BASEDIR} is not a directory or does not exist."
    exit 1
fi

# is we wanted more verbose output, we could do this:
echo "OUTDIR: ${OUTDIR}"
echo "SCRIPT_DIR: ${SCRIPT_DIR}"
echo "WHISPER_HOME: ${WHISPER_HOME}"
echo "WHISPER_EXEC: ${WHISPER_EXEC}"

# Check if OUTDIR exists, if not create it, exit on error
# We could also just exit with error if OUTDIR does not exist
if [[ ! -d "${OUTDIR}" ]]; then
    echo "Creating OUTDIR ${OUTDIR}"
    mkdir -p "${OUTDIR}" || exit 1
fi

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
