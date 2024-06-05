#!/usr/bin/env bash

# reliably get this script's directory as an absolute path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WHISPER_HOME="${SCRIPT_DIR}/../external-repos/whisper.cpp"
WHISPER_HOME="$( cd "${SCRIPT_DIR}/../external-repos/whisper.cpp" && pwd )"
WHISPER_EXEC="$WHISPER_HOME/main"
# Brew's whisper-cpp
# WHISPER_EXEC="whisper-cpp"
WHISPER_MODELS="${WHISPER_HOME}/models"
DEFAULT_OUTDIR="$HOME/Downloads/WhisperCPPContent"
DEFAULT_MODEL_SHORTNAME="base.en"
# Allowed model shortnames
ALLOWED_MODELS=("tiny.en" "base.en" "small.en" "medium.en")
# OUTPUT_FORMATS="--output-json --output-srt --output-vtt"
OUTPUT_FORMATS="--output-vtt"

# Initialize our own variables
BASEDIR=""
DURATION=0
MODEL_SHORTNAME=$DEFAULT_MODEL_SHORTNAME
OUTDIR=$DEFAULT_OUTDIR

# Usage function
usage() {
    cat << EOF
Usage: $0 -i base directory [-d duration] [-m model] [-o output]

Parameters:
  -i  Base directory (required, no default)
  -d  Duration (default: None, meaning entire file duration)
  -m  Model (default: $DEFAULT_MODEL_SHORTNAME)
  -o  Output (default: $DEFAULT_OUTDIR)

EOF
    exit 1
}

# Parse command line options
while getopts ":i:d:m:o:h" opt; do
  case ${opt} in
    i)
      BASEDIR=$OPTARG
      ;;
    d)
      DURATION=$OPTARG
      ;;
    m)
      MODEL_SHORTNAME=$OPTARG
      ;;
    o)
      OUTDIR=$OPTARG  # Set output directory
      ;;
    h)
      usage
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      usage
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      usage
      ;;
  esac
done
# Validate BASEDIR
if [[ ! -d "${BASEDIR}" ]]; then
    echo "Error: Invalid input directory: ${BASEDIR}"
    usage
fi

# Validate DURATION
if [[ -n "$DURATION" && ! "$DURATION" =~ ^[0-9]+$ ]]; then
    echo "Error: Duration ($DURATION) must be a positive integer."
    usage
fi

# Validate MODEL_SHORTNAME
if [[ ! " ${ALLOWED_MODELS[@]} " =~ " ${MODEL_SHORTNAME} " ]]; then
    echo "Error: Invalid model shortname. Allowed values are: ${ALLOWED_MODELS[*]}"
    usage
fi


echo "# Whisper Transcription"
echo ""
echo "## Configuration"
echo "- BASEDIR (input for m4b's): ${BASEDIR}"
echo "- MODEL_SHORTNAME: ${MODEL_SHORTNAME}"
if [[ -n "$DURATION" && "$DURATION" -gt 0 ]]; then
    echo "- DURATION: ${DURATION} seconds"
fi
echo "- OUTDIR: ${OUTDIR}"
echo "- SCRIPT_DIR: ${SCRIPT_DIR}"
echo "- WHISPER_HOME: ${WHISPER_HOME}"
echo "- WHISPER_EXEC: ${WHISPER_EXEC}"

# Check if OUTDIR exists, if not create it, exit on error
# We could also just exit with error if OUTDIR does not exist
if [[ ! -d "${OUTDIR}" ]]; then
    echo "Creating OUTDIR ${OUTDIR}"
    mkdir -p "${OUTDIR}" || exit 1
fi

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
    local prefix="$2.${MODEL_SHORTNAME}"
    if [[ -n "$DURATION" && "$DURATION" -gt 0 ]]; then
        prefix+=".d${DURATION}"
    fi

    if [ -f "${prefix}.srt" ] || [ -f "${prefix}.vtt" ] || [ -f "${prefix}.json" ]; then
        echo "Transcription files already exist, skipping processing."
    else
        echo "Launching whisper transcribe..."

        CMD=(${WHISPER_EXEC} -f "${wav}" -m ${WHISPER_MODELS}/ggml-${MODEL_SHORTNAME}.bin ${OUTPUT_FORMATS} -of "${prefix}")
        if [[ -n "$DURATION" && "$DURATION" -gt 0 ]]; then
            CMD+=(-d "${DURATION}")
        fi
        echo "CMD: ${CMD[@]}"
        time "${CMD[@]}"
    fi
}

echo ""
echo "# Scanning for .m4b in: ${BASEDIR}"

# Scan BASEDIR for m4b files
find "${BASEDIR}" -name \*.m4b | sort | while IFS= read -r m4b; do
    BOOKBASE=$(basename "${m4b}" .m4b)
    WAV_FILE="${OUTDIR}/${BOOKBASE}.wav"
    WHISPER_PFX="${OUTDIR}/${BOOKBASE}"

    echo ""
    echo "## Processing ${BOOKBASE}"
    echo ""
    echo "### Converting to WAV file"
    convert_to_wav "${m4b}" "${WAV_FILE}"
    echo ""
    echo "### Transcribing to SRT/VTT/JSON"
    whisper_transcribe "${WAV_FILE}" "${WHISPER_PFX}"
done
