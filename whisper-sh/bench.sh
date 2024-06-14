#!/usr/bin/env bash

# Define the sets of parameters
# MODELS=("tiny.en" "base.en" "small.en" "medium.en")
MODELS=("tiny.en" "base.en")
# MODELS=("tiny.en")
DURATIONS=("3600000" "7200000")
# DURATIONS=("900000" "1800000")
# DURATIONS=("900000")
WAV_FILE="${HOME}/Downloads/WhisperCPPContent/J.R.R. Tolkien - The Hobbit - Andy Serkis.wav"
RESULTS_DIR="./bench-results"
TEMP_DIR="./bench-temp-run"
mkdir -p "${RESULTS_DIR}"
mkdir -p "${TEMP_DIR}"

# whisper executable
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WHISPER_HOME="$(cd "${SCRIPT_DIR}/../external-repos/whisper.cpp" && pwd)"
WHISPER_EXEC="$WHISPER_HOME/main"
WHISPER_MODELS="${WHISPER_HOME}/models"
ARCH="$(uname -s)/$(uname -m)"

THREADS=8 # Override Default THREADS setting except on Darwin/arm64
# Set THREADS to 4 only for Darwin/arm64 systems
if [[ "$ARCH" == "Darwin/arm64" ]]; then
    THREADS=4
fi

# File naming
HOSTNAME=$(hostname -s)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
RESULT_FILE="${RESULTS_DIR}/${HOSTNAME}-${TIMESTAMP}.json"

# Output
cat << EOF | gum format --theme=light
# Whisper.sh Benchmark Results

Running whisper.sh with the following parameters:
- HOSTNAME:  $HOSTNAME
- ARCH:      $ARCH
- THREADS:   $THREADS
- WAV_FILE:  $(basename "${WAV_FILE}")
- RESULTS_FILE:   $RESULT_FILE
- MODELS:    ${MODELS[@]}
- DURATIONS: ${DURATIONS[@]}

EOF

# Initialize JSON file
echo "[]" > "${RESULT_FILE}" # Start with an empty JSON array

# Loop over the sets of parameters
for MODEL in "${MODELS[@]}"; do
    for DURATION in "${DURATIONS[@]}"; do
        START=$(date +%s)
        OUTPUT_PREFIX="${TEMP_DIR}/$(basename "${WAV_FILE}" .wav)-${MODEL}-${DURATION}"
        LOGFILE="${TEMP_DIR}/bench-${MODEL}-${DURATION}.log"
        CMD="${WHISPER_EXEC} -m ${WHISPER_MODELS}/ggml-${MODEL}.bin -d ${DURATION} -t $THREADS --output-vtt --output-file \"${OUTPUT_PREFIX}\" \"${WAV_FILE}\" >> \"${LOGFILE}\" 2>&1"

        # Execute the command and log it
        echo " .. command: ${CMD}" 
        gum spin --title "Running model:${MODEL} duration:${DURATION}" -- bash -c "${CMD}"
        END=$(date +%s)
        TIME=$((END - START))

        # Construct JSON entry
        JSON_ENTRY=$(jq -n \
                    --arg hostname "$HOSTNAME" \
                    --arg arch "$ARCH" \
                    --arg threads "$THREADS" \
                    --arg model "$MODEL" \
                    --arg duration "$DURATION" \
                    --argjson time "$TIME" \
                    '{hostname: $hostname, arch: $arch, threads: $threads, model: $model, audio_duration_ms: $duration, execution_time_sec: $time}')

        # Append JSON entry to the file
        jq ". += [$JSON_ENTRY]" "${RESULT_FILE}" > tmp.$$ && mv tmp.$$ "${RESULT_FILE}"
    done
done

generate_markdown_table() {
    local results_dir=$1
    local markdown_file="${results_dir}/summary_results.md"

    echo "# Summary Results" > "${markdown_file}"
    echo "" >> "${markdown_file}"
    # Start the markdown table with headers
    echo "| Hostname | Architecture | Model | Threads | Duration (ms) | Execution Time (s) |" >> "${markdown_file}"
    echo "|----------|--------------|-------|--------:|--------------:|-------------------:|" >> "${markdown_file}"

    # Iterate over all JSON files and extract data
    for json_file in "${results_dir}"/*.json; do
        jq -r '.[] | 
            "| \(.hostname) | \(.arch) | \(.model) | \(.threads) | \(.audio_duration_ms) | \(.execution_time_sec) |"' "${json_file}" >> "${markdown_file}"
    done
}

# Call the function with the results directory path
generate_markdown_table "${RESULTS_DIR}"
