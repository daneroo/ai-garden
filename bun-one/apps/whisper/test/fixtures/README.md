# Test Fixtures

Audio samples for testing.

## jfk.wav / jfk.mp3 / jfk.m4b

JFK's inaugural address excerpt (~11 seconds).

- Source:
  [whisper.cpp samples](https://github.com/ggerganov/whisper.cpp/tree/master/samples)
- Derived: `jfk.m4b` via
  `ffmpeg -y -hide_banner -i jfk.wav -c:a aac -b:a 64k jfk.m4b`

## roadnottaken.m4b

Robert Frost's "The Road Not Taken" poem (~76 seconds, ~1:16). Used for
integration tests with start/duration options.

- Source:
  [Poetry Foundation](https://www.poetryfoundation.org/poems/44272/the-road-not-taken)
  MP3, converted via Audiobookshelf.

## Checksums

See [sha256sums.txt](sha256sums.txt)

```bash
$ sha256sum -c sha256sums.txt
jfk.m4b: OK
jfk.mp3: OK
jfk.wav: OK
roadnottaken.m4b: OK
```
