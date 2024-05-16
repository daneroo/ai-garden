# audio-deno-match

Match the html content with vtt cues from deno

## TODO

- [ ] move to `tsx`
  - [ ] node's parseArgs, and styleText, .. and test
- [ ] call alignWords with start position, returns maximal match.
- [x] assert normalized(htmlDoc.body.textContent) === normalized(textNodes.join(' '))

## Usage

```bash
deno run -A module.ts # [road ruin blade]
deno run -A module.ts road; npx prettier -w output.html

deno run --allow-read module.ts --html ../audio-reader-html/media/theroadnottaken.html --vtt ../audio-reader-html/media/theroadnottaken.vtt
deno run --allow-read --allow-env module.ts --epub ../audio-reader-html/media/ruin.epub --vtt ../audio-reader-html/media/ruin.vtt
```

## References

- [tsx importer](https://tsx.is/)
  - [TSX Blog entry](https://dev.to/_staticvoid/how-to-run-typescript-natively-in-nodejs-with-tsx-3a0c)
- [syncabook](https://github.com/r4victor/syncabook)
- [afaligner](https://github.com/r4victor/afaligner)
- [Dynamic Time Warping](https://en.wikipedia.org/wiki/Dynamic_time_warping)
