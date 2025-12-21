# Test Fixtures

Audio samples for testing.

## jfk.wav / jfk.mp3 / jfk.m4b

JFK's inaugural address excerpt (~11 seconds).

**Origin:** `jfk.wav` and `jfk.mp3` are from the [whisper.cpp samples](https://github.com/ggerganov/whisper.cpp/tree/master/samples).

**Derived files:**

```bash
# M4B (for testing M4B conversion)
ffmpeg -y -hide_banner -i jfk.wav -c:a aac -b:a 64k jfk.m4b
```

**Checksums:** See [sha256sums.txt](sha256sums.txt)

```bash
$ sha256sum -c sha256sums.txt
jfk.m4b: OK
jfk.mp3: OK
jfk.wav: OK
```
