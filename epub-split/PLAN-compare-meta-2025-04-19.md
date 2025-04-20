# Parsing EPUB Metadata

## TODO

- [ ] do spine, manifest, guide
- [ ] compare metadata
- [ ] compare content

## Ebook parsing

- First file: META-INF/container.xml
  - Contains rootfile reference to main content file
  - Example:

    ```xml
    <?xml version="1.0"?>
    <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
       <rootfiles>
          <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
       </rootfiles>
    </container>
    ```

- Root file (content.opf)
  - Contains:
    - Metadata (title, author, etc.)
    - Manifest (list of all files)
    - Spine (reading order)
    - Guide (special sections)
  - Example structure:

    ```xml
    <?xml version="1.0"?>
    <package version="3.0" xmlns="http://www.idpf.org/2007/opf">
      <metadata>
        <!-- Book metadata -->
      </metadata>
      <manifest>
        <!-- List of all files -->
      </manifest>
      <spine>
        <!-- Reading order -->
      </spine>
      <guide>
        <!-- Special sections -->
      </guide>
    </package>
    ```

## Takeaways

### TOC Ambiguity

In our first examined case, `Adam Becker - What Is Real`, we see that: there are both `toc.xhtml` and `toc.ncx` present.

- `toc.ncx` is an NCX file that contains a table of contents.
- `toc.xhtml` is an HTML file that contains flattened table of contents with no nesting and styling is used to indicate indentation

- **Classes encode depth**  
  - `class="toc-chapter"` → level 1  
  - `class="toc-chapter2"` → level 2  
  - `class="toc-chapter3"` → level 3  
  (The numeric suffix denotes the intended hierarchy.)

But in general,

- **EpubJS `Navigation`**  
  - Prefers **HTML `<nav epub:type="toc">`** (e.g. `toc.xhtml`):  
    - **Respects nested `<ol>`** → populates each item’s `subitems` for true hierarchy  
    - If no nesting, produces a flat list and still ignores NCX  
  - Falls back to **NCX** only if no HTML nav is found  

- **lingo‑reader `EpubFile`**  
  - Always uses **NCX** (via `<spine toc="…">`):  
    - Builds hierarchy from nested `<navPoint>`s  
    - Ignores any HTML nav  
  - If no NCX is present, `getToc()` returns `[]`  

- **When both `toc.xhtml` & `toc.ncx` exist**  
  - **EpubJS** → parses **`toc.xhtml`** only  
  - **lingo‑reader** → parses **`toc.ncx`** only  

## Component Dependencies

1. Manifest (Required)
   - Must be first after metadata
   - Lists ALL files in the EPUB
   - Each file must have:
     - ID (unique identifier)
     - href (path to file)
     - media-type (MIME type)
   - Example:
     ```xml
     <manifest>
       <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
       <item id="chapter1" href="ch01.xhtml" media-type="application/xhtml+xml"/>
     </manifest>
     ```

2. Spine (Required)
   - Depends on manifest
   - Defines reading order
   - References manifest items by ID
   - Example:
     ```xml
     <spine toc="ncx">
       <itemref idref="chapter1"/>
     </spine>
     ```

3. TOC (Table of Contents)
   - Two possible formats:
     a. NCX (older format, referenced in spine)
     b. Navigation Document (nav.xhtml, newer format)
   - NCX is referenced in spine's `toc` attribute
   - Navigation Document is marked in manifest with `properties="nav"`

4. Guide (Optional)
   - Depends on manifest
   - Points to special sections like:
     - cover
     - title-page
     - toc
     - index
   - Example:
     ```xml
     <guide>
       <reference type="cover" title="Cover" href="cover.xhtml"/>
     </guide>
     ```

## Processing Order

1. Parse container.xml to find content.opf
2. Parse content.opf metadata
3. Parse manifest (required for all other components)
4. Parse spine (depends on manifest)
5. Parse TOC (either NCX or nav.xhtml)
6. Parse guide (if present)
