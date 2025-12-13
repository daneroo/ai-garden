#!/bin/bash
set -e

# --- Configuration ---
SOURCE_FILE="samples/hobbit.mp3"      # Exact 30m cut to remove loading overhead
FILE_LABEL=$(basename "$SOURCE_FILE" .mp3) # e.g. "hobbit-30m"
MODEL_BIN="models/ggml-tiny.en.bin"
MODEL_NAME="tiny"                         # Simple 'tiny' for WhisperKit
ITERATIONS=1                              # Number of iterations for each test
WHISPER_CPP_THREADS=6                     # Threads for whisper-cpp (Default 4, 6 P-cores, Max 10 on M2 Pro)
DURATION_MS="37482730"                     # 30 minutes
DURATION_SEC="37482"                       # 30 minutes
OUTPUT_DIR="output/smoke"

# Executables
EXEC_BREW="whisper-cli"
EXEC_SELF="../external-repos/whisper.cpp/build/bin/whisper-cli"
EXEC_KIT="whisperkit-cli"


# Validations
mkdir -p "$OUTPUT_DIR"

if [ ! -f "$SOURCE_FILE" ]; then
    echo "▲ Warning: $SOURCE_FILE not found. Tests might fail."
fi

# --- Functions ---

run_whisper_cpp() {
    local EXEC="$1"
    local LABEL="$2"
    local OUT_PREFIX="$3"
    local FLAVOR="$4"

    echo ""
    echo "----------------------------------------------------------------"
    echo "Running Smoke Test: $LABEL"
    echo "Binary: $EXEC"
    echo "----------------------------------------------------------------"

    if [ -f "$EXEC" ] || command -v "$EXEC" &> /dev/null; then
        for i in $(seq 1 $ITERATIONS); do
            local TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
            local LOGFILE="$OUTPUT_DIR/${FILE_LABEL}-${FLAVOR}-${TIMESTAMP}.log"
            
            # Construct the command
            local CMD="$EXEC -t $WHISPER_CPP_THREADS -m \"$MODEL_BIN\" -f \"$SOURCE_FILE\" -d \"$DURATION_MS\" --print-progress --output-json --output-vtt -of \"$OUT_PREFIX\" >> \"$LOGFILE\" 2>&1"
            
            echo "Command: $CMD" >> "$LOGFILE"
            
            local START=$(date +%s)
            
            if command -v gum &> /dev/null; then
                gum spin --title "Running $LABEL (Run $i/$ITERATIONS)..." -- bash -c "$CMD"
            else
                echo "Running (gum not found)..."
                bash -c "$CMD"
            fi
            
            local END=$(date +%s)
            local ELAPSED=$((END - START))
            local SPEEDUP=$(echo "scale=1; $DURATION_SEC / $ELAPSED" | bc -l 2>/dev/null || echo "N/A")
            # Fallback if bc/awk fails or duration is 0
            if [ "$SPEEDUP" = "" ]; then SPEEDUP="?"; fi
            
            echo "✓ Done in ${ELAPSED}s. Speedup: ${SPEEDUP}x." | tee -a "$LOGFILE"
        done
    else
        echo "▲  Binary not found: $EXEC. Skipping."
    fi
}

run_whisper_kit() {
    local EXEC="$1"
    local LABEL="$2"
    local OUT_PREFIX="$3"
    local FLAVOR="$4"

    echo ""
    echo "----------------------------------------------------------------"
    echo "Running Smoke Test: $LABEL"
    echo "Binary: $EXEC"
    echo "----------------------------------------------------------------"

    if command -v "$EXEC" &> /dev/null; then
        for i in $(seq 1 $ITERATIONS); do
            local TEMP_DIR="${OUT_PREFIX}_tmp"
            local TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
            local LOGFILE="$OUTPUT_DIR/${FILE_LABEL}-${FLAVOR}-${TIMESTAMP}.log"
            mkdir -p "$TEMP_DIR"
            
            # Construct the command
            local CMD="$EXEC transcribe --audio-path \"$SOURCE_FILE\" --model \"$MODEL_NAME\" --clip-timestamps 0 \"$DURATION_SEC\" --report --report-path \"$TEMP_DIR\" --verbose >> \"$LOGFILE\" 2>&1"
            
            echo "Command: $CMD" >> "$LOGFILE"

            local START=$(date +%s)
            
            if command -v gum &> /dev/null; then
                gum spin --title "Running $LABEL (Run $i/$ITERATIONS)..." -- bash -c "$CMD"
            else
                echo "Running (gum not found)..."
                bash -c "$CMD"
            fi
            
            local END=$(date +%s)
            local ELAPSED=$((END - START))
            local SPEEDUP=$(echo "scale=1; $DURATION_SEC / $ELAPSED" | bc -l 2>/dev/null || echo "N/A")

            # Move and rename artifacts
            if [ -f "$TEMP_DIR/${FILE_LABEL}.json" ]; then
                mv "$TEMP_DIR/${FILE_LABEL}.json" "${OUT_PREFIX}.json"
            fi

            if [ -f "$TEMP_DIR/${FILE_LABEL}.srt" ]; then
                mv "$TEMP_DIR/${FILE_LABEL}.srt" "${OUT_PREFIX}.srt"
                
                # Convert SRT to VTT for consistency
                if command -v ffmpeg &> /dev/null; then
                    ffmpeg -y -hide_banner -loglevel error \
                        -i "${OUT_PREFIX}.srt" \
                        "${OUT_PREFIX}.vtt"
                fi
            fi

            rm -rf "$TEMP_DIR"
            
            echo "✓ Done in ${ELAPSED}s. Speedup: ${SPEEDUP}x." | tee -a "$LOGFILE"
        done
    else
        echo "▲  Binary not found: $EXEC. Skipping."
    fi
}

# --- Execution ---

echo "================================================================"
echo "Global Configuration"
echo "Source:   $SOURCE_FILE"
echo "Duration: ${DURATION_SEC}s"
echo "================================================================"

# 1. Homebrew whisper-cpp
run_whisper_cpp "$EXEC_BREW" "Homebrew whisper-cli" "$OUTPUT_DIR/${FILE_LABEL}-brew" "brew"

# 2. Self-compiled whisper-cpp
run_whisper_cpp "$EXEC_SELF" "Self-compiled whisper-cli" "$OUTPUT_DIR/${FILE_LABEL}-self" "self"

# 3. WhisperKit CLI
run_whisper_kit "$EXEC_KIT" "WhisperKit CLI" "$OUTPUT_DIR/${FILE_LABEL}-kit" "kit"

echo ""
echo "✓ Smoke tests complete. Results in $OUTPUT_DIR/"
