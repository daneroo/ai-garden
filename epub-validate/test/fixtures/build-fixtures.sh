#!/usr/bin/env bash
# Regenerates the crafted EPUB fixtures used by unit/integration tests.
#
# These are NOT a corpus root — they are deliberately small, hand-built inputs
# loaded directly by tests. The `test` corpus root (../test-books) stays valid
# EPUBs only; malformed inputs live here.
#
# The committed .epub files are the artifacts; this script documents how they
# were made and lets us rebuild them. EPUB requires the `mimetype` entry first
# and stored uncompressed, which is why each archive is built in two zip passes.
#
# Fixtures:
#   epub2-minimal.epub            valid EPUB 2.0 (NCX toc) — storyteller should
#                                 report epub2-unsupported; epub.ts opens it.
#   entity-ampersand-in-title.epub valid EPUB 3.0 whose title contains a literal
#                                 ampersand ("Legends & Lattes"); reproduces the
#                                 epubts-node/LinkeDOM entity-truncation on the
#                                 node path while browser/storyteller keep it.
#   malformed-truncated-zip.epub  a valid zip truncated past its End Of Central
#                                 Directory record — every parser open-fails.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

build_epub() {
  # build_epub <output.epub> <src-dir>
  local out="$1" src="$2"
  rm -f "$out"
  ( cd "$src" && zip -X -0 -q "$out" mimetype \
      && zip -X -9 -q -r "$out" . -x mimetype )
}

# --- shared pieces -----------------------------------------------------------
container_xml='<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>'

chapter_xhtml='<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>Chapter 1</title></head>
  <body><h1>Chapter 1</h1><p>The body text is irrelevant to these tests.</p></body>
</html>'

# --- epub2-minimal.epub ------------------------------------------------------
e2="$work/epub2"
mkdir -p "$e2/META-INF"
printf 'application/epub+zip' > "$e2/mimetype"
printf '%s' "$container_xml" > "$e2/META-INF/container.xml"
printf '%s' "$chapter_xhtml" > "$e2/ch1.xhtml"
cat > "$e2/content.opf" <<'OPF'
<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="bookid" opf:scheme="UUID">urn:uuid:epub2-minimal-fixture</dc:identifier>
    <dc:title>Epub Two Minimal</dc:title>
    <dc:creator>Test Author</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>2001-01-01</dc:date>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="ch1"/>
  </spine>
</package>
OPF
cat > "$e2/toc.ncx" <<'NCX'
<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:epub2-minimal-fixture"/></head>
  <docTitle><text>Epub Two Minimal</text></docTitle>
  <navMap>
    <navPoint id="np1" playOrder="1">
      <navLabel><text>Chapter 1</text></navLabel>
      <content src="ch1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>
NCX
build_epub "$here/epub2-minimal.epub" "$e2"

# --- entity-ampersand-in-title.epub (EPUB 3) ---------------------------------
e3="$work/epub3"
mkdir -p "$e3/META-INF"
printf 'application/epub+zip' > "$e3/mimetype"
printf '%s' "$container_xml" > "$e3/META-INF/container.xml"
printf '%s' "$chapter_xhtml" > "$e3/ch1.xhtml"
cat > "$e3/nav.xhtml" <<'NAV'
<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>Navigation</title></head>
  <body><nav epub:type="toc"><ol><li><a href="ch1.xhtml">Chapter 1</a></li></ol></nav></body>
</html>
NAV
cat > "$e3/content.opf" <<'OPF'
<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:entity-ampersand-fixture</dc:identifier>
    <dc:title>Legends &amp; Lattes</dc:title>
    <dc:creator>Travis Baldree</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>2022-02-22</dc:date>
    <meta property="dcterms:modified">2022-02-22T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" properties="nav" media-type="application/xhtml+xml"/>
    <item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="ch1"/>
  </spine>
</package>
OPF
build_epub "$here/entity-ampersand-in-title.epub" "$e3"

# --- malformed-truncated-zip.epub --------------------------------------------
# Build a valid EPUB-like zip, then chop off its tail so the End Of Central
# Directory record is gone: a generic "not a zip / EOCD not found" failure.
bad="$work/bad"
mkdir -p "$bad/META-INF"
printf 'application/epub+zip' > "$bad/mimetype"
printf '%s' "$container_xml" > "$bad/META-INF/container.xml"
printf '%s' "$chapter_xhtml" > "$bad/ch1.xhtml"
build_epub "$work/full.epub" "$bad"
full_size=$(wc -c < "$work/full.epub")
keep=$(( full_size - 64 ))
head -c "$keep" "$work/full.epub" > "$here/malformed-truncated-zip.epub"

echo "Built fixtures in $here:"
ls -l "$here"/*.epub
