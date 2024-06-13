#!/usr/bin/env bash

# Define the sets of parameters
# MODELS=("tiny.en" "base.en" "small.en" "medium.en")
# MODELS=("tiny.en" "base.en")
MODELS=("tiny.en")
# 1min, 5min, 1hr, 5hr
DURATIONS=("60000" "300000" "3600000" "18000000")
# 1hr, 2hr
DURATIONS=("3600000" "7200000")
WAV_FILE="${HOME}/Downloads/WhisperCPPContent/J.R.R. Tolkien - The Hobbit - Andy Serkis.wav"
# WAV_FILE="/Volumes/Reading/audiobooks/Stephen Kotkin - Stalin/Stephen Kotkin - Stalin 01 - Paradoxes of Power"
OUTDIR="./bench-results"

# whisper executable
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WHISPER_HOME="$( cd "${SCRIPT_DIR}/../external-repos/whisper.cpp" && pwd )"
WHISPER_EXEC="$WHISPER_HOME/main"
WHISPER_MODELS="${WHISPER_HOME}/models"
ARCH=$(uname -sm)
THREADS=8

# Initialize the markdown results file
cat << EOF | tee results.md
# Whisper.sh Benchmark Results

Running whisper.sh with the following parameters:
WAV_FILE: $(basename "${WAV_FILE}")
OUTDIR: $OUTDIR
MODELS: ${MODELS[@]}
DURATIONS: ${DURATIONS[@]}
ARCH: $ARCH
THREADS: $THREADS

EOF

# Check if there are any log or vtt files in the output directory
if [[ $(find "${OUTDIR}" -maxdepth 1 -name "*.log" -o -name "*.vtt") ]]; then
    # Ask the user whether to remove all log and vtt files
    if gum confirm "Do you want to remove all (previous) log and vtt files?"; then
        rm "${OUTDIR}"/*.log "${OUTDIR}"/*.vtt
    fi
fi

# Initialize the markdown table
echo "| Arch | Threads | Model | Duration (ms) | Execution Time (s) |" | tee -a results.md
echo "|------|---------|-------|---------------|--------------------|" | tee -a results.md

# Loop over the sets of parameters
for MODEL in "${MODELS[@]}"; do
    for DURATION in "${DURATIONS[@]}"; do
        # Run whisper.sh and capture the time it took
        START=$(date +%s)
        OUTPUT_PREFIX="${OUTDIR}/$(basename "${WAV_FILE}" .wav)-${MODEL}-${DURATION}"
        LOGFILE="${OUTDIR}/bench-${MODEL}-${DURATION}.log"
        CMD="${WHISPER_EXEC} -m ${WHISPER_MODELS}/ggml-${MODEL}.bin -d ${DURATION} -t $THREADS --output-vtt --output-file \"${OUTPUT_PREFIX}\" \"${WAV_FILE}\""

        # Display command for debugging purposes
        echo "CMD: ${CMD}" >"${LOGFILE}"
        # Execute the command and let the shell handle the glob expansion
        bash -c "${CMD}" >>${LOGFILE} 2>&1

        END=$(date +%s)
        TIME=$((END - START))

        # Add the results to the markdown table
        echo "| $ARCH | $THREADS | $MODEL | $DURATION | $TIME |" | tee -a results.md
    done
done

cat << EOF | tee -a results.md

Results also saved to results.md"

Prompt to convert:
Convert the detailed table listing execution times for each model at different durations into a summarized format. 
The original table has multiple rows per model, each specifying the duration in milliseconds and
the corresponding execution time in seconds. 
The summarized table should have one row per model, 
with separate columns for the execution times corresponding to each duration. 
The column headers should reflect the execution times for the different durations. 
In the final table, express the duration (column headers) in minutes or hours.
The summarized table should be in markdown format.
EOF