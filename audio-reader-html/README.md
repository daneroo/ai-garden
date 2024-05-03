# Audio Reader

Simplest possible UI, which plays an audio media file (m4b,mp3) and displays a transcript of the audio (VTT).

Currently, using CDN Loaded React, with a single App.jsx file.

```bash
pnpx serve .
```

## Prompts

```txt
This is the answer I got from Claude 3, can you do better?

I have an .m4b audio file, and I can produce a .vtt transcript of it. How can I play that in a browser. Ideally the transcript's text would be in a scrolling area, and current transcript test would be highlighted
```

```txt
Write a program (Javascript)
- I have two texts,
  - the first is a list of subtitles
  - the second is an HTML representation of the text

I wish to match each subtitle entry to a position/range in the HTML
Discuss the matching algorithm, which must account for misspelling, case, missing/extra punctuation etc.
```

```txt
Ok, I have thought much, this is what I think I need;
I need to produce a normalized text representation of the DOM,
which is easy enough with topElement.innerText,
but I also need a reverse map from any character range in the normalized text to the original DOM node.

How can I produce this reverseMap by traversing the DOM?
Perhaps traversing the DOM and adding an entry for each text node?
```

## TODO

- Linearize text-node-tree, and preserve map to original nodes.
  - easy match -> partial 'certain results'
  - constrained sub problems - with combinatorics, or fuzzy matches.
- Implement an initial fuzzy match
  - Normalization: lowercase, remove non-alphanumeric characters (except spaces), and collapse multiple spaces into a single space.
  - Segmentation: phrase split
  - Handling Missing or Extra Words

## References

- <https://github.com/muxinc/media-chrome>
  - <https://www.media-chrome.org/docs/en/get-started>
- <https://www.fusejs.io/>
- Similarity
  - <https://github.com/nol13/fuzzball.js>
    - <https://unpkg.com/browse/fuzzball@2.1.2/dist/>
    - <https://cdn.jsdelivr.net/npm/fuzzball/>
  - <https://github.com/words/soundex-code>
  - <https://github.com/words/double-metaphone>
  - <https://github.com/words/dice-coefficient>
