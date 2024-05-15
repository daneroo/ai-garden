#!/usr/bin/env bash

# Define the sets of parameters
# ALLOWED_MODELS=("tiny.en" "base.en" "small.en" "medium.en")
MODELS=("tiny.en" "base.en" "small.en")
# 1min, 5min, 1hr, 5hr
DURATIONS=("60000" "300000" "3600000" "18000000")
# DURATIONS=("60000" "120000")
BASEDIR="/Volumes/Reading/audiobooks/John Gwynne - Faithful and the Fallen/John Gwynne - Faithful and the Fallen 04 - Wrath"
OUTDIR="./bench-results"

# Initialize the markdown results file
cat << EOF | tee results.md
# Whisper.sh Benchmark Results

Running whisper.sh with the following parameters:
BASEDIR: $(basename "${BASEDIR}")
OUTDIR: $OUTDIR
MODELS: ${MODELS[@]}
DURATIONS: ${DURATIONS[@]}

EOF

# Check if there are any log or vtt files in the output directory
if [[ $(find "${OUTDIR}" -maxdepth 1 -name "*.log" -o -name "*.vtt") ]]; then
    # Ask the user whether to remove all log and vtt files
    if gum confirm "Do you want to remove all (previous) log and vtt files?"; then
        rm "${OUTDIR}"/*.log "${OUTDIR}"/*.vtt
    fi
fi

# Initialize the markdown table
echo "| Model | Duration (ms) | Execution Time (s) |" | tee -a results.md
echo "|-------|----------|------|" | tee -a results.md

# Loop over the sets of parameters
for MODEL in "${MODELS[@]}"; do
    for DURATION in "${DURATIONS[@]}"; do
        # Run whisper.sh and capture the time it took
        START=$(date +%s)
        LOGFILE="${OUTDIR}/bench-${MODEL}-${DURATION}.log"
        ./whisper.sh -i "${BASEDIR}" -d "$DURATION" -m "$MODEL" -o "${OUTDIR}" >"${LOGFILE}" 2>&1
        END=$(date +%s)
        TIME=$((END - START))

        # Add the results to the markdown table
        echo "| $MODEL | $DURATION | $TIME |" | tee -a results.md
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