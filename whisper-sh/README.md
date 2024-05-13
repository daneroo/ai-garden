# Whisper.cpp invocation

This is just a coordination script.
We keep the [whisper.cpp](https://github.com/daneroo/whisper.cpp/tree/master) in `external-repos`

As of 2023-09-16 I can;t get bindings/go to work on the mac mini,
so I have reverted to using the `main` binary.

We want to:

- process `.m4b` files directly
- process wav
- produce SRT/VTT/JSON

## TODO

- [ ] Do some benchmarks (including Core ML support)
  - [x] Metal support (galois)
  - [ ] Core ML support (galois, feynman)
  - [ ] Validate on Mac x86_64
    - [ ] feynman - AMD Radeon RX 580 - Not working
    - [ ] dirac - Not working
  - [ ] Validate on Linux (VM/Docker)
- [x] Move my fork into into ai-garden/external-repos
- [x] Run the examples from the top level and `main` binary

## Operation

We created the `whisper.sh` script to coordinate the invocation of the `main` binary,
as well as attendant ffmpeg commands to produce intermediate `.wav` files.

We invoke our script with the root path to the `.m4b` files we want to transcribe.
From there the .wav files are created and transcribed.

```bash
 ./whisper.sh /Volumes/Reading/audiobooks/Joe\ Abercrombie\ -\ The\ First\ Law/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself
./whisper.sh /Volumes/Reading/audiobooks/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen\ 03\ -\ Ruin/
./whisper.sh /Volumes/Reading/audiobooks/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen\ 04
./whisper.sh /Volumes/Reading/audiobooks/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen/John\ Gwynne\ -\ Faithful\ and\ the\ Fallen\ 04\ -\ Wrath/
```

## Setup (whisper.cpp)

### Whisper.cpp clone and/ort update

The upstream repo [whisper.cpp](https://github.com/daneroo/whisper.cpp/tree/master) in `external-repos`

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
75 models/ggml-tiny.en.bin
145 models/ggml-base.en.bin
469 models/ggml-small.en.bin
1468 models/ggml-medium.en.bin
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

## Benchmarks

On Mac Mini M2 Pro 32GB

```bash
# ggml-metal - models/ggml-base.en.bin - 1 thread - 16minutes

# -d duration 1 hour 3600000 x model size
time ./main -f ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav -d 3600000 -m models/ggml-tiny.en.bin
whisper_print_timings:      mel time = 42274.54 ms
whisper_print_timings:   sample time =  4920.10 ms / 12981 runs (    0.38 ms per run)
whisper_print_timings:   encode time =  4720.96 ms /   135 runs (   34.97 ms per run)
whisper_print_timings:   decode time = 17601.31 ms / 12847 runs (    1.37 ms per run)
whisper_print_timings:   prompt time =   762.09 ms /   134 runs (    5.69 ms per run)
whisper_print_timings:    total time = 71772.46 ms

time ./main -f ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav -d 3600000 -m models/ggml-base.en.bin
whisper_print_timings:      mel time = 42378.63 ms
whisper_print_timings:   sample time =  4690.46 ms / 12051 runs (    0.39 ms per run)
whisper_print_timings:   encode time = 10618.96 ms /   162 runs (   65.55 ms per run)
whisper_print_timings:   decode time = 25354.13 ms / 11890 runs (    2.13 ms per run)
whisper_print_timings:   prompt time =  1743.80 ms /   161 runs (   10.83 ms per run)
whisper_print_timings:    total time = 86311.54 ms

time ./main -f ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav -d 3600000 -m models/ggml-small.en.bin
whisper_print_timings:      mel time = 42287.89 ms
whisper_print_timings:   sample time =  4930.70 ms / 12836 runs (    0.38 ms per run)
whisper_print_timings:   encode time = 27163.83 ms /   140 runs (  194.03 ms per run)
whisper_print_timings:   decode time = 67844.86 ms / 12697 runs (    5.34 ms per run)
whisper_print_timings:   prompt time =  4650.46 ms /   139 runs (   33.46 ms per run)
whisper_print_timings:    total time = 148541.02 ms

time ./main -f ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav -d 3600000 -m models/ggml-medium.en.bin
whisper_print_timings:      mel time = 47669.28 ms
whisper_print_timings:   sample time =  5132.43 ms / 13573 runs (    0.38 ms per run)
whisper_print_timings:   encode time = 72753.66 ms /   132 runs (  551.16 ms per run)
whisper_print_timings:   decode time = 166653.44 ms / 13440 runs (   12.40 ms per run)
whisper_print_timings:   prompt time = 12492.16 ms /   132 runs (   94.64 ms per run)
whisper_print_timings:    total time = 306824.75 ms

# tiny.en - metal: 8 threads - slower than 4 threads??
time ./main -f ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav -d 3600000 -m models/ggml-tiny.en.bin -t 8 -p 4
whisper_print_timings:      mel time = 53952.79 ms
whisper_print_timings:   sample time =  4988.94 ms / 12981 runs (    0.38 ms per run)
whisper_print_timings:   encode time =  4950.49 ms /   135 runs (   36.67 ms per run)
whisper_print_timings:   decode time = 18083.11 ms / 12847 runs (    1.41 ms per run)
whisper_print_timings:   prompt time =   761.85 ms /   134 runs (    5.69 ms per run)
whisper_print_timings:    total time = 84282.57 ms

# tiny.en - metal: 8 threads 4 processors - even slower than 8 th 1 proc
time ./main -f ~/Downloads/MacWhisperContent/Joe\ Abercrombie\ -\ The\ First\ Law\ 01\ -\ The\ Blade\ Itself.wav -d 3600000 -m models/ggml-tiny.en.bin -t 8 -p 4
whisper_print_timings:      mel time = 43397.42 ms
whisper_print_timings:   sample time =  5641.44 ms / 51966 runs (    0.11 ms per run)
whisper_print_timings:   encode time =  5996.71 ms /   543 runs (   11.04 ms per run)
whisper_print_timings:   decode time = 36890.00 ms / 51425 runs (    0.72 ms per run)
whisper_print_timings:   prompt time =  4838.65 ms /   540 runs (    8.96 ms per run)
whisper_print_timings:    total time = 97459.04 ms
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
