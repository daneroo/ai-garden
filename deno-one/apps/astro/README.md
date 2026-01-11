# Astro Docs Site

Benchmark documentation site built with Astro and Deno.

## TODO

- [ ] REDO THIS WHILE THING WITH STARLIGHT
- [ ] Add REACT FOR content for vtt-compare

## Usage

```bash
deno task dev    # Start dev server at http://localhost:4321
deno task build  # Build static site to dist/
```

## Status: Spike Successful ✓

- Astro 5.16 runs with Deno
- Content collections work for markdown
- Static build produces proper HTML
- No node_modules required (Deno manages npm packages)

## Content

Markdown files in `src/content/docs/` are automatically rendered:

- `/docs/benchmark` - Whisper benchmark results
- `/docs/vtt-compare` - VTT comparison preparation
