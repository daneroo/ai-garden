---
type: feature
priority: medium
created: 2026-01-14T22:40:00Z
status: implemented
tags: [books, liveview, filesystem]
keywords: [audiobooks, books, liveview, AUDIOBOOKS_ROOT_DIR, file listing, filter]
patterns: [runtime config, liveview table, file scan, route link]
---

# FEATURE-001: MVP web library listing

## Description

Create a LiveView page that lists audiobooks from a configured root directory. The list should be visible in a table, allow filtering by partial filename or path, and show basic file details.

## Context

This is the first user-facing feature in the Elixir/Ash app and mirrors the bookfinder experiment. The goal is a simple, readable library page for a single user, with more advanced features and metadata extraction planned for later tickets.

## Requirements

### Functional Requirements

- Read the audiobooks root directory from `AUDIOBOOKS_ROOT_DIR` at runtime.
- Recursively scan all files under the root directory.
- Display a table of results showing basename, full path, file size, and modified time.
- Default sorting is by full path.
- Provide a filter input for partial filename or path match.
- Add a link to the new Books page from the home page alongside the existing links.
- Show a clear empty state when no files are found.
- Use LiveView for the Books page.

### Non-Functional Requirements

- Keep implementation simple and synchronous for now.
- No pagination or metadata extraction in this ticket.
- No authentication or authorization.

## Current State

The Phoenix app runs with a home page and basic layout but no Books page or file listing.

## Desired State

A `/books` LiveView page lists files from the configured root directory with filter support, and the home page links to it.

## Research Context

### Keywords to Search

- `AUDIOBOOKS_ROOT_DIR` - runtime configuration for the root directory.
- `LiveView` - existing LiveView patterns and route definitions.
- `File.ls`, `Path.wildcard` - filesystem scan options in Elixir.
- `File.stat` - file size and mtime retrieval.

### Patterns to Investigate

- runtime config in `config/runtime.exs` - loading env vars for runtime settings.
- LiveView table and filter components - existing UI patterns.
- Home page links and router updates - where to add navigation.

### Key Decisions Made

- No Ash resources yet to avoid cache or DB invalidation.
- Recursive scan of the root directory.
- Filter by partial match; sorting by full path.
- Use LiveView for the Books page.

## Success Criteria

### Automated Verification

- [ ] `mix test` passes if tests are added.

### Manual Verification

- [ ] Setting `AUDIOBOOKS_ROOT_DIR` shows files in the Books table.
- [ ] Filter input narrows results by partial filename or path.
- [ ] Home page link navigates to `/books`.
- [ ] Empty state appears when no files are found.

## Related Information

- Experiment reference: `experiments/bookfinder-opencode`

## Notes

- Metadata extraction is deferred to a follow-up ticket using a Hex library.
