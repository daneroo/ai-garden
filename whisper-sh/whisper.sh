#!/usr/bin/env bash

# reliably get this script's directory as an absolute path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WHISPER_HOME="$( cd "${SCRIPT_DIR}/../external-repos/whisper.cpp" && pwd )"
WHISPER_EXEC="$WHISPER_HOME/build/bin/whisper-cli"
WHISPER_MODELS="${WHISPER_HOME}/models"
DEFAULT_OUTDIR="$HOME/Downloads/WhisperCPPContent"
DEFAULT_MODEL_SHORTNAME="base.en"
# Allowed model shortnames
ALLOWED_MODELS=("tiny.en" "base.en" "small.en" "medium.en")

# Constants
MAX_WAV_DURATION_SECONDS=133200 # 37 hours
# SEGMENT_LENGTH_SECONDS=3600 # 1hr
# SEGMENT_LENGTH_SECONDS=72000 # 20hrs
# SEGMENT_LENGTH_SECONDS=126000 # 35hrs
SEGMENT_LENGTH_SECONDS="${MAX_WAV_DURATION_SECONDS}" # could be a parameter


# Initialize our own variables
BASEDIR=""
DURATION=0
MODEL_SHORTNAME=$DEFAULT_MODEL_SHORTNAME
OUTDIR=$DEFAULT_OUTDIR

# Usage function
usage() {
    cat << EOF
Usage: $0 -i base directory [-n] [-d duration] [-m model] [-o output]

Parameters:
  -i  Base directory (required, no default)
  -n  Dry-run mode (default: False)
  -d  Duration (seconds) transcription (default: None, meaning entire file duration)
  -m  Model (default: $DEFAULT_MODEL_SHORTNAME)
  -o  Output (default: $DEFAULT_OUTDIR)
EOF
    exit 1
}

# Parse command line options
while getopts ":i:nd:m:o:h" opt; do
  case ${opt} in
    n)
      DRYRUN=true
      ;;
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

# Validate DURATION if present
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

# Convert m4b to wav
# - split if >37hrs or requested
convert_to_wav() {
    local m4b="$1"
    local wav="$2"
    # Extract the directory part and filename base from wav
    local WAVEDIR=$(dirname "${wav}")
    local WAVBASE=$(basename "${wav}" .wav)

    local duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${m4b}" 2>/dev/null)
    if [[ -z "$duration" ]]; then
        echo "Error: Could not get duration of ${m4b}"
        exit 1
    fi
    # Convert duration to integer by rounding up - to use in bash comparisons (requires)
    duration_int=$(printf "%.0f" "$duration")

    echo "- Input file: ${m4b}"
    echo "- Duration: ${duration}"

    # Build up the ffmpeg conversion command
    # Document flags used:
    cmd="ffmpeg"
    # Overwrite output files without asking
    cmd+=" -y"
    # Suppress the ffmpeg banner output and show only critical error messages
    cmd+=" -hide_banner -loglevel panic"
    # Specify the input file (the m4b audiobook)
    cmd+=" -i \"${m4b}\""
    # Encode audio in PCM signed 16-bit little-endian format, with a 16 kHz sample rate and mono channel
    cmd+=" -c:a pcm_s16le -ar 16000 -ac 1"
    # Apply the audio filter to reset timestamps based on frame index (N), sample rate (SR), and time base (TB)
    cmd+=" -af \"asetpts=N/SR/TB\""
    # Reset timestamps for each segment so that they start at zero
    cmd+=" -reset_timestamps 1"

    # conditional part of the command if duration <= SEGMENT_LENGTH_SECONDS
    if [[ "$duration_int" -le "$SEGMENT_LENGTH_SECONDS" ]]; then
      cmd+=" \"${WAVEDIR}/${WAVBASE}.wav\""
      # Check if the output file already exists to avoid redundant processing
      if [[ -f "${WAVEDIR}/${WAVBASE}.wav" ]]; then
          echo "Output file already exists. Skipping conversion..."
          printf '%s\n' "${WAVEDIR}/${WAVBASE}.wav"  # Print the existing output file
          return
      fi
    else
      echo "Duration is greater than SEGMENT_LENGTH_SECONDS:${SEGMENT_LENGTH_SECONDS} seconds, splitting into segments"

      # Use the segment muxer to split output into multiple files, with each segment lasting SEGMENT_LENGTH_SECONDS seconds
      cmd+=" -f segment -segment_time ${SEGMENT_LENGTH_SECONDS}"
      # Force key frames at each segment boundary for better accuracy using an expression:
      # "expr:gte(t,n_forced*${SEGMENT_LENGTH_SECONDS})" means force a key frame when the timestamp t is greater than or equal to n_forced times the segment length.
      cmd+=" -force_key_frames \"expr:gte(t,n_forced*${SEGMENT_LENGTH_SECONDS})\""

      # Specify the output file pattern, using a three-digit segment index
      cmd+=" \"${WAVEDIR}/${WAVBASE}_part_%03d.wav\""

      # Check if any segment already exists to avoid redundant processing
      shopt -s nullglob  # Enable nullglob option to handle non-matching patterns
      segment_files=("${WAVEDIR}/${WAVBASE}_part_"*.wav)
      if [ "${#segment_files[@]}" -gt 0 ]; then
          echo "Segment files already exist. Skipping conversion..."
          printf '%s\n' "${segment_files[@]}"  # Print the existing segment files
          return
      fi
      shopt -u nullglob  # Undo nullglob option
    fi




    if [[ "$DRYRUN" == true ]]; then
      echo "Dry-run: Would convert with command"
      echo "$cmd"
      return
    else
      echo "Converting with command"
      echo "$cmd"
      # Execute the command
      time bash -c "$cmd"

    fi

}

whisper_transcribe() {
    local wav="$1"
    # Derive directory and base name for WAV files
    local WAVEDIR=$(dirname "${wav}")
    local WAVBASE=$(basename "${wav}" .wav)

    # OUTPUT_FORMATS="--output-json --output-srt --output-vtt"
    OUTPUT_FORMATS="--output-vtt"

    # Calculate the glob pattern for VTT segment files
    shopt -s nullglob  # Enable nullglob option
    vtt_files=("${WAVEDIR}/${WAVBASE}_part_"*.vtt)
    if [ "${#vtt_files[@]}" -gt 0 ]; then
        echo "Transcription files already exist, skipping processing."
        printf '%s\n' "${vtt_files[@]}"  # Print the existing transcription files
        return
    fi
    shopt -u nullglob  # Undo nullglob option

    local cmd="${WHISPER_EXEC} -m ${WHISPER_MODELS}/ggml-${MODEL_SHORTNAME}.bin ${OUTPUT_FORMATS}"
    # make it faster: need experimentation
    cmd+=" -t 8 -p 8"
    # print progress
    cmd+=" --print-progress" # or -pp
    if [[ -n "${DURATION}" && "${DURATION}" -gt 0 ]]; then
        # seconds to milliseconds
        cmd+=" -d ${DURATION}000"
    fi

    # Check whether we have segments or a single file
    shopt -s nullglob  # Enable nullglob option
    segment_files=("${WAVEDIR}/${WAVBASE}_part_"*.wav)
    single_file="${WAVEDIR}/${WAVBASE}.wav"
    
    if [ "${#segment_files[@]}" -gt 0 ]; then
        echo "Working with segments:"
        printf '%s\n' "${segment_files[@]}"
        # We use the already expanded segment_files array instead of relying on glob expansion in the command
        # This ensures each file is properly quoted and passed as individual arguments to whisper-cli
        # Example: whisper-cli ... "file_part_000.wav" "file_part_001.wav" instead of "file_part_*.wav"
        segment_files_quoted=$(printf '"%s" ' "${segment_files[@]}")
        cmd+=" ${segment_files_quoted}"
    elif [ -f "$single_file" ]; then
        echo "Working with single file: ${single_file}"
        cmd+=" \"${single_file}\""
    else
        echo "Error: No WAV file(s) found (neither segments nor single file)"
        echo "Expected either:"
        echo "- Single file: ${single_file}"
        echo "- Segment files: ${WAVEDIR}/${WAVBASE}_part_*.wav"
        exit 1
    fi
    shopt -u nullglob  # Undo nullglob option

    if [[ "$DRYRUN" == true ]]; then
      echo "Dry-run: Would transcribe with command"
      echo "$cmd"
      return
    else
      echo "Transcribing with command"
      echo "$cmd"
      time bash -c "$cmd"
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
