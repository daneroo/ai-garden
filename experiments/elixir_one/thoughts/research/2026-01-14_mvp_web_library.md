---
date: 2026-01-14T22:49:06Z
git_commit: eb55aafbb037ec35e95299029519b9f9d59ed2e6
branch: main
repository: git@github.com:daneroo/ai-garden.git
topic: "MVP web library listing (LiveView)"
tags: [research, phoenix, liveview, filesystem, config]
last_updated: 2026-01-14T22:49:06Z
---

# MVP web library listing (LiveView)

## Ticket Synopsis

Create a LiveView Books page that reads a runtime `AUDIOBOOKS_ROOT_DIR`, recursively scans files, lists basename/path/size/mtime, filters by partial match, and adds a navigation link from the home page. Keep it synchronous, no Ash resources, no pagination, no auth.

## Summary

The codebase currently has a single controller-driven home page and a router that only defines the root route, so a new LiveView module and route must be added. UI building blocks like a table and input components already exist in `ElixirOneWeb.CoreComponents`. Runtime config is managed in `config/runtime.exs` with `System.get_env/1`, which is the canonical place to add `AUDIOBOOKS_ROOT_DIR`.

## Detailed Findings

### Routing and home page

- The router only defines `get "/", PageController, :home` in the `:browser` pipeline, so `/books` will need to be added as a LiveView route. (`lib/elixir_one_web/router.ex:17`)
- The home page links are hard-coded in the template; a Books link can be inserted alongside the existing three call-to-action cards. (`lib/elixir_one_web/controllers/page_html/home.html.heex:67`)
- The home action is a simple controller render, so navigation changes should be template-only. (`lib/elixir_one_web/controllers/page_controller.ex:4`)

### LiveView and UI components

- The LiveView router helpers are already imported in `ElixirOneWeb`, so LiveView routes and `<.link navigate={...}>` are available. (`lib/elixir_one_web.ex:22`)
- The shared table component (`<.table>`) is defined with headers and row slots, good for the book list. (`lib/elixir_one_web/components/core_components.ex:331`)
- The form/input components are available via `<.input>` for the filter field and styling. (`lib/elixir_one_web/components/core_components.ex:119`)

### Runtime configuration

- `config/runtime.exs` is the canonical place for environment-driven configuration, already using `System.get_env/1` for `PORT`, `PHX_HOST`, etc. (`config/runtime.exs:19`)
- There is no existing app-level config for audiobooks, so adding `config :elixir_one, :audiobooks_root_dir, System.get_env("AUDIOBOOKS_ROOT_DIR")` here fits the pattern. (`config/runtime.exs:23`)

### Filesystem scanning

- No existing file scanning utilities were found in the Elixir app. A new module will be needed (e.g., `ElixirOne.Library.Scanner`) to walk directories recursively and collect file stats.
- The prior bookfinder experiment favored manual recursion with `readdir`/`lstat` for precise control. That pattern can inform Elixir’s use of `File.ls/1`, `File.stat/1`, and `Path.join/2` for a synchronous scan.

## Code References

- `experiments/elixir_one/lib/elixir_one_web/router.ex:17` - current router scope and root route.
- `experiments/elixir_one/lib/elixir_one_web/controllers/page_html/home.html.heex:67` - current CTA links area for adding Books link.
- `experiments/elixir_one/lib/elixir_one_web/controllers/page_controller.ex:4` - home controller action.
- `experiments/elixir_one/lib/elixir_one_web.ex:22` - LiveView router imports and helpers.
- `experiments/elixir_one/lib/elixir_one_web/components/core_components.ex:331` - table component for listing rows.
- `experiments/elixir_one/lib/elixir_one_web/components/core_components.ex:119` - input component for filter field.
- `experiments/elixir_one/config/runtime.exs:19` - runtime config via env variables.

## Architecture Insights

- UI is built with Phoenix component helpers and shared core components; sticking to `<.table>` and `<.input>` keeps styling consistent with the generated app.
- Runtime configuration is already the established pattern for env-backed settings, so `AUDIOBOOKS_ROOT_DIR` belongs in `runtime.exs` rather than `dev.exs`.

## Historical Context (from thoughts/)

- `experiments/2026-01-14-bookfinder/thoughts/research/2026-01-14_m4b_scanner.md` - recommends manual recursive traversal for fine-grained error handling and symlink detection, which can guide the Elixir scan approach.
- `experiments/2026-01-14-bookfinder/thoughts/tickets/feature_m4b_scanner.md` - baseline requirements for recursive scan and metadata fields.
- `experiments/2026-01-14-bookfinder/thoughts/plans/m4b_scanner.md` - suggests streaming results as they’re found; relevant if LiveView wants incremental updates later.

## Related Research

- `experiments/2026-01-14-bookfinder/thoughts/research/2026-01-14_metadata_extraction.md`

## Open Questions

- Whether to surface scan errors in the UI or silently skip unreadable directories.
- Whether to format sizes/mtime in the LiveView or in the scanner module.
