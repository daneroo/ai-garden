# audio-deno-match

Match the html content with vtt cues from deno

## TODO

- [ ] assert normalized(htmlDoc.body.textContent) === normalized(textNodes.join(' '))

## Usage

```bash
deno run -A module.ts # [road ruin blade]
deno run -A module.ts road; npx prettier -w output.html

deno run --allow-read module.ts --html ../audio-reader-html/media/theroadnottaken.html --vtt ../audio-reader-html/media/theroadnottaken.vtt
deno run --allow-read --allow-env module.ts --epub ../audio-reader-html/media/ruin.epub --vtt ../audio-reader-html/media/ruin.vtt
```

## References

- [syncabook](https://github.com/r4victor/syncabook)
- [afaligner](https://github.com/r4victor/afaligner)
- [Dynamic Time Warping](https://en.wikipedia.org/wiki/Dynamic_time_warping)
