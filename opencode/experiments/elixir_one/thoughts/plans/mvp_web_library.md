# MVP Web Library Listing Implementation Plan

## Overview

Implement a `/books` LiveView that scans `AUDIOBOOKS_ROOT_DIR` recursively, formats size and ISO mtime, filters by case-insensitive substring match, and displays UI warnings for unreadable paths. Add a Books link to the home page.

## Current State Analysis

- Router only defines the root controller route. (`lib/elixir_one_web/router.ex:17`)
- Home page CTA links are hard-coded in the template. (`lib/elixir_one_web/controllers/page_html/home.html.heex:67`)
- Shared UI components include `<.table>` and `<.input>` which fit the table + filter UI. (`lib/elixir_one_web/components/core_components.ex:331`)
- Runtime config already uses `System.get_env/1` in `config/runtime.exs`. (`config/runtime.exs:19`)

## Desired End State

- `AUDIOBOOKS_ROOT_DIR` is read in `config/runtime.exs` and available to the app.
- A `ElixirOne.Library.Scanner` module provides recursive scanning, formatted size/mtime, and captures scan warnings.
- `/books` LiveView renders a table of results with a filter input and warning rows.
- Home page includes a Books link alongside the existing three CTA links.

### Key Discoveries

- LiveView route helpers are available via `ElixirOneWeb` (`lib/elixir_one_web.ex:22`).
- Table and input components exist and should be reused (`lib/elixir_one_web/components/core_components.ex:331`).

## What We're NOT Doing

- No Ash resources or DB persistence.
- No metadata extraction beyond size + mtime.
- No pagination or async scanning.
- No authentication or authorization.

## Implementation Approach

Create a small scanner module that returns a list of entries (file or warning), each with formatted size and ISO mtime. The LiveView calls this scanner on mount, applies filtering in-memory, and renders results with the shared table component. Errors are captured as warning rows for display.

## Phase 1: Runtime Config + Scanner Module

### Overview

Define `AUDIOBOOKS_ROOT_DIR` runtime config and build a reusable scanner module for recursive traversal.

### Changes Required

#### 1. Runtime Config

**File**: `experiments/elixir_one/config/runtime.exs`
**Changes**:

- Add `config :elixir_one, :audiobooks_root_dir, System.get_env("AUDIOBOOKS_ROOT_DIR")` near other runtime env usage.

#### 2. Scanner Module

**File**: `experiments/elixir_one/lib/elixir_one/library/scanner.ex`
**Changes**:

- New module that exposes `scan/1` returning `{files, warnings}` or a single list of entries.
- Implement recursive traversal via `File.ls/1`, `File.stat/1`, `Path.join/2`.
- Include helper functions to format size (human readable) and mtime (`DateTime.to_iso8601`).
- Represent warning rows with a distinct struct or map containing `path` + `error`.

```elixir
# Example entry
%{type: :file, basename: "book.m4b", path: "/...", size: "1.2 GB", mtime: "2026-01-14T22:00:00Z"}
%{type: :warning, path: "/...", error: "permission denied"}
```

### Success Criteria

#### Automated Verification

- [ ] `mix test` passes if tests are added.

#### Manual Verification

- [ ] Scanner returns file entries and warnings when pointed at a mixed-permission tree.

---

## Phase 2: Books LiveView UI

### Overview

Create a new LiveView that renders the scanner output, filter input, and warnings table.

### Changes Required

#### 1. LiveView Module

**File**: `experiments/elixir_one/lib/elixir_one_web/live/books_live.ex`
**Changes**:

- `mount/3` loads `AUDIOBOOKS_ROOT_DIR` from config, calls `Scanner.scan/1`.
- Store entries in assigns and apply a case-insensitive filter on `handle_event("filter", ...)`.
- Use `<.table>` for file rows and include a warning row style when entry type is `:warning`.
- Start template with `<Layouts.app flash={@flash}>` per app guidelines.

#### 2. LiveView Template

**File**: `experiments/elixir_one/lib/elixir_one_web/live/books_live.html.heex`
**Changes**:

- Use `<.input>` for filter field.
- Render empty state if no entries match.
- Display basename, path, size, mtime columns; include warning text in a dedicated column or row span.

### Success Criteria

#### Automated Verification

- [ ] `mix test` passes if tests are added.

#### Manual Verification

- [ ] `/books` shows the table with files and warnings.
- [ ] Filter narrows results by substring, case-insensitive.
- [ ] Empty state appears when filter matches nothing.

---

## Phase 3: Routing + Navigation

### Overview

Wire the LiveView into the router and add a home page link.

### Changes Required

#### 1. Router

**File**: `experiments/elixir_one/lib/elixir_one_web/router.ex`
**Changes**:

- Add `live "/books", BooksLive` in the root scope.

#### 2. Home Page Link

**File**: `experiments/elixir_one/lib/elixir_one_web/controllers/page_html/home.html.heex`
**Changes**:

- Add a CTA card linking to `~p"/books"` alongside the existing three links.

### Success Criteria

#### Automated Verification

- [ ] `mix test` passes if tests are added.

#### Manual Verification

- [ ] Home page Books link navigates to `/books`.

---

## Testing Strategy

### Unit Tests

- Optional: scanner unit tests for formatting and warning cases.

### Integration Tests

- Optional: LiveView test verifying filter and row rendering.

### Manual Testing Steps

1. Set `AUDIOBOOKS_ROOT_DIR` and run `mix phx.server`.
2. Visit `/books`, confirm files + warnings show.
3. Use filter input to narrow results.
4. Clear filter and confirm full list returns.

## Performance Considerations

- Synchronous scan on mount is acceptable for MVP; if it becomes slow, move to streamed LiveView updates later.

## References

- Ticket: `experiments/elixir_one/thoughts/tickets/feature_mvp_web_library.md`
- Research: `experiments/elixir_one/thoughts/research/2026-01-14_mvp_web_library.md`
- Core components: `experiments/elixir_one/lib/elixir_one_web/components/core_components.ex:331`

## Implementation Status

- [x] Phase 1: Runtime config and scanner module
- [x] Phase 2: Books LiveView UI
- [x] Phase 3: Routing and navigation
- [ ] Verification: manual smoke test
