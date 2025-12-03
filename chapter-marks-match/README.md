# Chapter Marks Matching

- First with Cursor
- Then with Gemini (Antigravity)

## Ideas

- use bun as my scrtipng layer, as a test for the rest
- audio + whisper to validate fin boundaries
- n-gram histograms and

## Context

This sub-project in the Mono repo is part of my ongoing attempt to use AI and AI like things to work with audiobooks and e-pub books. One big project is to completely synchronize the audio stream with the parts of the EPUB HTML.

So just to get started we're going to practice with some a very small part which is to figure out if the chapter marks inside the audiobook which are m4b files is actually precisely positioned.

Limited objective is to find the chapter marks in the current audio file then use use whisper to see if the bookmarks are preciseley positioned.

So to get started we're going to assume that the text label of the chapter bookmark will be included in the audio, which is not always the case. But we're going to select an audiobook for which this is true.

So my audiobook/epub books are rooted in /Volumes/Space/Reading/audiobooks/
The book we are going to use, which has correct chapter books marks is: `Emad Mostaque - The Last Economy`.

```bash
> find /Volumes/Space/Reading/audiobooks/Emad\ Mostaque\ -\ The\ Last\ Economy/
/Volumes/Space/Reading/audiobooks/Emad Mostaque - The Last Economy/
/Volumes/Space/Reading/audiobooks/Emad Mostaque - The Last Economy/Emad Mostaque - The Last Economy.epub
/Volumes/Space/Reading/audiobooks/Emad Mostaque - The Last Economy/metadata.json
/Volumes/Space/Reading/audiobooks/Emad Mostaque - The Last Economy/cover.jpg
/Volumes/Space/Reading/audiobooks/Emad Mostaque - The Last Economy/Emad Mostaque - The Last Economy.m4b
```

Just to make this easy, we won't even have to parse the audio file because all the chapters are also in the metadata.json file.

```bash
daniel@galois:.../ai-garden/chapter-marks-match main[?] ❯ cat /Volumes/Space/Reading/audiobooks/Emad\ Mostaque\ -\ The\ Last\ Economy/metadata.json |jq .chapters
[
  {
    "id": 0,
    "start": 0,
    "end": 592.770612,
    "title": "Introduction: The Thousand-Day Window"
  },
  ...
  {
    "id": 22,
    "start": 14091.781224,
    "end": 14436.075102,
    "title": "Epilogue: The Thousandth Day"
  }
```

## Objective

We want to confirm that the audio at each chapter bookmark contains the audio matching the chapter title. This is not true in general for audiobooks, but it is true for this book

## Plan

### Phase 1

- show the bookmarks
- run `ffplay` at each chapter bookmark (a few seconds)
- invoke whisper on each of those chapter bookmarks

I think this is simple enough to do in a bash script
