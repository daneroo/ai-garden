# WhisperKit (cli)

I have decided not to use WhisperKit (cli) for transcription. because it
produces transcriptions with a lot of monotonicity violations. i.e. successive
cues which are not strictly increasing in time.

I have left these instruction to dpocument the removal of whisperkit-cli, and
especilaly it's models.

WhisperKit was originally installed with homebrew.

```bash
brew install --formula whisperkit-cli
```

## Cleanup (Models directories)

We can safely remove the entire MODEL directory, as it was automatically created
and populated by WhisperKit.

```bash
#  if it otherwose empty you can even delete the containing directory
rm -rf ~/Documents/huggingface/models
```

## Models Directory

```bash
# Models Directory: where whisperkit stores its models.
MODELS_DIR=~/Documents/huggingface/models
echo; echo; echo
echo "Total size of whisperkit models: $(du -sh $MODELS_DIR 2>/dev/null || echo "Directory not found")"
# The models are split into two parts
# $MODELS_DIR/argmaxinc/whisperkit-coreml/
# $MODELS_DIR/openai/
```

I you want to trigger a transcription to download a model, you can do this:

```bash
# A sample audio fie
SAMPLE="/Volumes/Space/Reading/audiobooks/Robert Frost - The Road Not Taken/Robert Frost - The Road Not Taken.m4b"

# Run a transcription - to trigger a model download
# models: tiny.en, tiny, base.en, base, small.en, small, medium.en, medium, large-v3, large-v2, large
whisperkit-cli transcribe --model tiny --audio-path "$SAMPLE" --verbose
```
