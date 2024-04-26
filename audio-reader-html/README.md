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

- Get the audio playing on iPad
  - index_old - Not working on iPad, but working elsewhere
  - audio - not loading tracks, anywhere?
  - clone audio2 from index_old, and converge to audio
- Clean up html when everything is working
- Port back to React
