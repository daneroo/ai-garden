#!/bin/bash

# Array of books in format: "filename|gutenberg_id"
BOOKS=(
    "aristotle-nicomachean-ethics.epub|8438"
    "abbott-flatland.epub|201"
    "dickens-tale-of-two-cities.epub|98"
    "carroll-alice-in-wonderland.epub|19033"
)

# Get the absolute path of the directory containing this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "# Downloading Test Books"
echo " - Destination: $SCRIPT_DIR"
echo

for book in "${BOOKS[@]}"; do
    # Split the string into filename and ID
    IFS='|' read -r filename id <<< "$book"
    filepath="$SCRIPT_DIR/$filename"
    
    if [ ! -f "$filepath" ]; then
        echo "Downloading $filename..."
        curl -L -o "$filepath" "https://www.gutenberg.org/ebooks/$id.epub3.images"
        
        if [ $? -eq 0 ]; then
            echo "✓ Successfully downloaded $filename"
        else
            echo "✗ Failed to download $filename"
            rm -f "$filepath"  # Clean up partial download
        fi
    else
        echo "✓ $filename already exists"
    fi
done

echo
echo "All books downloaded to $SCRIPT_DIR" 