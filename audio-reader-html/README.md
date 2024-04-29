# Audio Reader

Simplest possible UI, which plays an audio media file (m4b,mp3) and displays a transcript of the audio (VTT).

Currently, using CDN Loaded React, with a single App.jsx file.

```bash
pnpx serve .
```

```txt
This is the answer I got from Claude 3, can you do better?

I have an .m4b audio file, and I can produce a .vtt transcript of it. How can I play that in a browser. Ideally the transcript's text would be in a scrolling area, and current transcript test would be highlighted
```

## TODO

- Implement an initial fuzzy match
- Clean up html when everything is working
- Port back to React

## References

- <https://github.com/muxinc/media-chrome>
  - <https://www.media-chrome.org/docs/en/get-started>
- <https://www.fusejs.io/>
