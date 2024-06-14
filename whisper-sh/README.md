# Whisper.cpp invocation

This is just a coordination script.
We keep the [whisper.cpp](https://github.com/ggerganov/whisper.cpp/tree/master) in `external-repos`

As of 2023-09-16 I can;t get bindings/go to work on the mac mini,
so I have reverted to using the `main` binary.

We want to:

- process `.m4b` files directly
- process wav
- produce SRT/VTT/JSON

## TODO

- home brew - get inspiration from nix pkg: <https://github.com/NixOS/nixpkgs/blob/nixos-24.05/pkgs/tools/audio/openai-whisper-cpp/default.nix#L115>
  - GGML_METAL_PATH_RESOURCES = ...
- fix whisper.sh to to single part files again
- [ ] make a standard benchmark
  - [ ] run bench on galois
  - [ ] run bench on feynman
- [ ] use `-ot XXms` to offset output vtt
- [ ] cleanup the scripts (prompts and validation)
- [ ] run in docker/nix/brew

## piping/splitting with ffmpeg to whisper

So, the maximum duration of a WAV file that can be created under the 4 GiB limit, given your audio settings, is approximately 37 hours, 16 minutes, and 57.728 seconds.

We can split the wav files into segments, but alignment seems to be a problem.

```bash
for i in split/*wav; do echo $i $(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$i") ; done
for i in ~/Downloads/WhisperCPPContent/*wav; do echo $i $(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$i") ; done
```

## Nix - openai-whisper-cpp

```bash
nix-shell -p openai-whisper-cpp

# download models
mkdir models
(cd models; whisper-cpp-download-ggml-model tiny.en)
(cd models; whisper-cpp-download-ggml-model base.en)

whisper-cpp -m ./models/ggml-tiny.en.bin -d 360000 "/Users/daniel/Downloads/WhisperCPPContent/J.R.R. Tolkien - The Hobbit - Andy Serkis.wav"
```

## Homebrew - whisper-cpp

Using brew's `brew install whisper-cpp` is working at about half speed, METAL is not loading properly.

```txt
ggml_metal_init: loading 'ggml-metal.metal'
ggml_metal_init: error: Error Domain=MTLLibraryErrorDomain Code=3 "program_source:3:10: fatal error: 'ggml-common.h' file not found
#include "ggml-common.h"
```

## Operation

We created the `whisper.sh` script to coordinate the invocation of the `main` binary,
as well as attendant ffmpeg commands to produce intermediate `.wav` files.

We invoke our script with the root path to the `.m4b` files we want to transcribe.
From there the .wav files are created and transcribed.

CoreML didn't change performance, so just using metal.

```bash
 ❯ ./whisper.sh -h
Usage: ./whisper.sh -i base directory [-d duration] [-m model] [-o output]
Parameters:
  -i  Base directory (required, no default)
  -d  Duration (default: None, meaning entire file duration)
  -m  Model (default: base.en)
  -o  Output (default: /Users/daniel/Downloads/WhisperCPPContent)

./whisper.sh -i /Volumes/Reading/audiobooks/Joe\ Abercrombie\ -\ The\ First\ Law/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself

./whisper.sh -i /Volumes/Reading/audiobooks/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen\ 03\ -\ Ruin/

./whisper.sh -i /Volumes/Reading/audiobooks/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen\ 04\ -\ Wrath/
# force tiny.en model, default is base.en
./whisper.sh -m tiny.en -i /Volumes/Reading/audiobooks/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen\ 04\ -\ Wrath/

 ./whisper.sh -i /Volumes/Reading/audiobooks/Iain\ M.\ Banks\ -\ Culture\ Novels/Iain\ M.\ Banks\ -\ Culture\ 03\ -\ Use\ Of\ Weapons/
 ./whisper.sh -m tiny.en -i /Volumes/Reading/audiobooks/Iain\ M.\ Banks\ -\ Culture\ Novels/Iain\ M.\ Banks\ -\ Culture\ 03\ -\ Use\ Of\ Weapons/

 ./whisper.sh -i /Volumes/Reading/audiobooks/Stephen\ Kotkin\ -\ Stalin/Stephen\ Kotkin\ -\ Stalin\ 01\ -\ Paradoxes\ of\ Power/
 ./whisper.sh -m tiny.en -i /Volumes/Reading/audiobooks/Stephen\ Kotkin\ -\ Stalin/Stephen\ Kotkin\ -\ Stalin\ 01\ -\ Paradoxes\ of\ Power/
```

## Setup (whisper.cpp)

See Nix pkg: <https://github.com/NixOS/nixpkgs/blob/nixos-23.11/pkgs/tools/audio/openai-whisper-cpp/default.nix#L57>

The brew formula has problems using METAL/GPU.

### Whisper.cpp clone and/or update

The upstream repo [whisper.cpp](https://github.com/ggerganov/whisper.cpp/tree/master) in `external-repos`

We might want to periodically update the repo and models.

```bash
# clone the repo
cd external-repos/
git clone git@github.com:ggerganov/whisper.cpp.git
cd whisper.cpp

# update the repo
git pull
```

### Get some models

The models are stored in `external-repos/whisper.cpp/models/`.

```bash
# get some models (.en) tiny.en base.en small.en medium.en (no large.en)
# get some more models (all langs) tiny base small medium large-v1 large

bash ./models/download-ggml-model.sh tiny.en
bash ./models/download-ggml-model.sh base.en
bash ./models/download-ggml-model.sh small.en
bash ./models/download-ggml-model.sh medium.en

du -sm models/ggml*bin|sort -n
75      models/ggml-tiny.en.bin
146     models/ggml-base.en.bin
481     models/ggml-small.en.bin
1472    models/ggml-medium.en.bin
```

### Build the main binary

```bash
make clean
# build the main example
make
# transcribe an audio file
./main -f samples/jfk.wav
./main -m models/ggml-tiny.en.bin -f samples/jfk.wav
```

### Neural Engine: ANE

I built the binary with WHISPER_COREML=1,etc as in the README, but it made **no difference in runtime**.

```bash
# ?? asdf local python 3.10.0
python3 -m venv py310-whisper
source py310-whisper/bin/activate
pip install ane_transformers openai-whisper coremltools

./models/generate-coreml-model.sh base.en
# using Makefile
make clean
WHISPER_COREML=1 make -j

deactivate
```

## Benchmarks

you can use `./bench.sh` to re-run the benchmarks.

| Model   | Architecture  | 1 hour (s) | 2 hours (s) | 3 hours (s) | Marginal Time (s/h) |
| ------- | ------------- | ---------: | ----------: | ----------: | ------------------: |
| tiny.en | Darwin/arm64  |         83 |         144 |         213 |                  65 |
| tiny.en | Darwin/x86_64 |        160 |         279 |         405 |                 123 |
| base.en | Darwin/arm64  |        114 |         216 |         305 |                  96 |
| base.en | Darwin/x86_64 |        261 |         517 |         760 |                 250 |

![Bench Plot](./bench-results/bench-plot.png)

Prompt to convert `bench-results/summary_results.md`:

```txt
Convert the detailed table listing execution times for each model at different durations into a summarized format.
The original table has multiple rows per model, each specifying the duration in milliseconds and
the corresponding execution time in seconds.
The summarized table should have one row per model and architecture,
with separate columns for the execution times corresponding to each duration.
The column headers should reflect the execution times for the different durations.
In the final table, express the duration (column headers) in minutes.
The summarized table should be in markdown format.
Finally Add a column for the `Marginal execution time / per hour`, which you can estimate with a linear fit of the execution time vs duration in hours.

Order by Model, then ARCH.
```

## Transcribe a single .m4b file with a pipe

This added 55s to convert the entire file to wav... but it works!

```bash
time ffmpeg -i /Volumes/Reading/audiobooks/Joe\ Abercrombie\ -\ The\ First\ Law/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.m4b -ar 16000 -ac 1 -c:a pcm_s16le -f wav - | time ./main -f - -m models/ggml-tiny.en.bin


time ffmpeg -i /Volumes/Reading/audiobooks/Joe\ Abercrombie\ -\ The\ First\ Law/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.m4b -ar 16000 -ac 1 -c:a pcm_s16le -f wav - | ./main -f - -d 3600000 -m models/ggml-tiny.en.bin
whisper_print_timings:      mel time = 43280.52 ms
whisper_print_timings:   sample time =  5071.32 ms / 12981 runs (    0.39 ms per run)
whisper_print_timings:   encode time =  4664.09 ms /   135 runs (   34.55 ms per run)
whisper_print_timings:   decode time = 17424.11 ms / 12847 runs (    1.36 ms per run)
whisper_print_timings:   prompt time =   760.03 ms /   134 runs (    5.67 ms per run)
whisper_print_timings:    total time = 127309.86 ms
```

## Output type (SRT/VTT)

```bash
# SRT is the default
#   -osrt,     --output-srt        [false  ] output result in a srt file
#   -ovtt,     --output-vtt        [false  ] output result in a vtt file
time ./main -f ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav -d 3600000 -m models/ggml-tiny.en.bin --output-srt

time ./main -f ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav -d 60000 -m models/ggml-tiny.en.bin --output-vtt

time ./main -f ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav -d 60000 -m models/ggml-tiny.en.bin --output-json

# All together
time ./main -f ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav -d 60000 -m models/ggml-tiny.en.bin --output-json --output-srt --output-vtt

# All together with base filename for output (coco)
time ./main -f ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav -d 60000 -m models/ggml-tiny.en.bin --output-json --output-srt --output-vtt -of coco
```

## First attempt at a script

```bash
SRCDIR="/Volumes/Reading/audiobooks/J.R.R. Tolkien - The Lord of the Rings - Andy Serkis"
OUTDIR="$HOME/Downloads/MacWhisperContent"

# ffmpeg loop madness I could not get this to work otherwise!!!
find "${SRCDIR}" -name \*.m4b | sort | while IFS= read -r f; do
    base=$(basename "${f}" .m4b)
    wavfile="${OUTDIR}/${base}.wav"
    cmd="ffmpeg -y -hide_banner -loglevel panic -i \"${f}\" -ar 16000 -ac 1 -c:a pcm_s16le \"${wavfile}\""
    echo "echo \"Converting to wav ${wavfile}\""
    echo "time ${cmd}"
done >temp-commands.sh
time source temp-commands.sh
rm temp-commands.sh

find "${OUTDIR}" -name \*.wav | sort | while IFS= read -r f; do
    wavfile="${f}"
    base=$(basename "${f}" .wav)
    transcribe_pfx="${OUTDIR}/${base}"

    echo "# Processing ${f}"
    echo "## Whispering ${base} to SRT/VTT/JSON"
    echo
    time ./main -f "${wavfile}" -m models/ggml-tiny.en.bin --output-json --output-srt --output-vtt -of "${transcribe_pfx}"
done

```

```bash
# Convert to .wav 16kHz - mono
time ffmpeg -y -i "Joe Abercrombie - The First Law 01 - The Blade Itself.m4b" -ar 16000 -ac 1 "Joe Abercrombie - The First Law 01 - The Blade Itself.wav"

 ./build/go-whisper -model models/ggml-tiny.en.bin ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav


time ffmpeg -y -i "00 The End.mp3" -ar 16000 -ac 1 "00 The End.wav"
 ./build/go-whisper -model models/ggml-tiny.en.bin ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav

# This works
time ./build/go-whisper -model models/ggml-tiny.en.bin ~/Downloads/MacWhisperContent/00\ The\ End.wav

# now split into chunks
time ./build/go-whisper --offset 4m --duration 2m -model models/ggml-tiny.en.bin ~/Downloads/MacWhisperContent/00\ The\ End.wav
```

By Chunks:

```bash
ffmpeg -i input.mp3 -ar 16000 -ac 1 -c:a pcm_s16le output.wav

for i in {0..5}; do
    start_time=$((i*10*60))
    ffmpeg -i "Joe Abercrombie - The First Law 01 - The Blade Itself.m4b" -ar 16000 -ac 1 -c:a pcm_s16le -ss $start_time -t 600 "Joe Abercrombie - The First Law 01 - The Blade Itself_part$(($i+1)).wav"
done

for i in {1..6}; do
    time ./build/go-whisper -model models/ggml-tiny.en.bin ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself_part${i}.wav
done

# or as args to the program, and with ggml-base.en.bin this time
time ./build/go-whisper -model models/ggml-base.en.bin ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself_part*.wav
```
