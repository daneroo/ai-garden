# audio-deno-match

Match the html content with vtt cues from deno

## TODO

- produce epubcfi() style matches
- [ ] move to `tsx`
  - [ ] node's parseArgs, and styleText, .. and test
- [ ] call alignWords with start position, returns maximal match.
- [x] assert normalized(htmlDoc.body.textContent) ===
      normalized(textNodes.join(' '))

## Usage

```bash
deno task start
# == deno run -A module.ts [road|weapons|blade|ruin|wrath]

deno task start road
# == deno run -A module.ts road; npx prettier -w output/align.html

# Legacy examples (may require updates)
deno run --allow-read module.ts --html ../audio-reader-html/media/theroadnottaken.html --vtt ../audio-reader-html/media/theroadnottaken.vtt
deno run --allow-read --allow-env module.ts --epub ../audio-reader-html/media/ruin.epub --vtt ../audio-reader-html/media/ruin.vtt
```

## Match Result (epubcfi)

This is one idea for a match result. We would produce a _corrected_ vtt, with
epubcfi() style matches.

- Possibly correct spelling, missed/extra words
- Include an epubcfi() range as prefix for each vtt cue

Input HTML, VTT

```html Pyramids_split_004.html
<body class="calibre">
  <div class="calibre1">
    <p class="calibre6">
      <a href="Pyramids_split_002.html#filepos786" class="calibre14">
        <span class="calibre19">
          <span class="italic">
            <span class="bold">
              <span class="calibre15">The Book of Going Forth</span>
            </span>
          </span>
        </span>
      </a>
    </p>
  </div>
</body>
```

```vtt
00:02:00.000 --> 00:02:08.000
 Book one, the book of going forth.
```

We construct a working epubcfi as follows:

- Package Part:
  - `/6/2[Pyramids_split_004.html]`
  - (Indicating that this file is the second content document.)

- Local Path:
  - `!/4/2/2/2/2/2/2/1:0,/4/2/2/2/2/2/2/1:23`
  - (Navigating from the body down through the first elements until reaching the
    `<span class="calibre15">`, then pointing to its text node from offset 0 to
    23.)

Resulting epubcfi:

```vtt
00:02:00.000 --> 00:02:08.000
 epubcfi(/6/2[Pyramids_split_004.html]!/4/2/2/2/2/2/2/1:0,/4/2/2/2/2/2/2/1:23) Book one, the book of going forth.
```

## References

- [tsx importer](https://tsx.is/)
  - [TSX Blog entry](https://dev.to/_staticvoid/how-to-run-typescript-natively-in-nodejs-with-tsx-3a0c)
- [syncabook](https://github.com/r4victor/syncabook)
- [afaligner](https://github.com/r4victor/afaligner)
- [Dynamic Time Warping](https://en.wikipedia.org/wiki/Dynamic_time_warping)
