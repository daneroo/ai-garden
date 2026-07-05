# TMUX Client and Minimal Workflow Requirements

## Purpose

Define a small, usable tmux model for a terminal workflow that works across local terminals, SSH, Ghostty, T3 Code, VS Code terminals, and similar clients.

This document is about requirements and vocabulary, not implementation.

The goal is to make tmux usable as a durable workspace backend without adopting the full tmux universe.

## Problem

The user wants a single pane-of-glass terminal workflow across local and homelab machines.

They use or may use:

- Ghostty on macOS
- Ghostty on Linux
- other Linux terminal apps
- SSH
- T3 Code terminal
- VS Code / Cursor terminals
- tmux

The current problem is conceptual overload:

- every app has windows, tabs, panes, splits, sessions, or similar terms;
- tmux has its own windows and panes;
- terminal emulators also have tabs and splits;
- remote SSH sessions add another layer;
- the user does not want to learn or use 99% of tmux.

The desired solution is a very small tmux vocabulary and a minimal required action set.

## Core idea

A terminal client is disposable.

tmux is durable.

SSH is transport.

The user should be able to close or restart the local client and reconnect to the same tmux-backed workspace, especially on remote machines.

## Definitions

### Client

A client is the visible application or surface where the user types.

Examples:

- Ghostty on macOS
- Ghostty on Linux
- another Linux terminal
- T3 Code terminal
- VS Code terminal
- Cursor terminal
- an SSH command launched from any of the above

The client is a viewport/input surface. It is not the durable state.

### Terminal session

A terminal session is the local terminal process/PTY created by a client.

It may run a shell directly, or it may run SSH, or it may run tmux.

### Transport

A transport connects the local client to another machine.

For this project, the transport is normally SSH.

### tmux server

The tmux server is the background process that owns durable terminal state on a machine.

There can be a tmux server on the local machine or on a remote machine.

### tmux session

A tmux session is a named durable workspace inside a tmux server.

For this workflow, a tmux session should usually correspond to one durable context, such as:

- local machine workspace
- remote machine workspace
- project
- repo/worktree
- ops context
- dev context

### tmux window

A tmux window is a tab-like thing inside a tmux session.

For this workflow, a tmux window should usually correspond to one task inside a workspace, such as:

- shell
- logs
- server
- git
- agent
- database
- editor

### tmux pane

A tmux pane is a split-like thing inside a tmux window.

For this workflow, panes should be used sparingly, only for tightly related side-by-side processes.

Examples:

- server plus logs
- agent plus git diff
- database shell plus migration output

### Shell/process

The shell/process is the actual program running inside a tmux pane.

Examples:

- shell
- editor
- dev server
- logs
- SSH
- agent CLI
- database shell

## Layer diagrams

### Local tmux

```text
client
  -> local terminal session
    -> local tmux server
      -> tmux session
        -> tmux window
          -> tmux pane
            -> shell/process
```

Example:

```text
Ghostty on galois
  -> tmux session: local:galois:infra
    -> window: shell
    -> window: server
    -> window: logs
```

### Remote tmux over SSH

```text
client
  -> local terminal session
    -> ssh transport
      -> remote tmux server
        -> tmux session
          -> tmux window
            -> tmux pane
              -> shell/process
```

Example:

```text
Ghostty on galois
  -> ssh gauss
    -> tmux session: remote:gauss:dev
      -> window: shell
      -> window: logs
      -> window: agent
```

## What survives

### Client closes or restarts

tmux survives if the tmux server is still running.

### SSH disconnects

Remote tmux survives if the remote machine and tmux server are still running.

### Local machine reboots

Local tmux does not survive by default.

### Remote machine reboots

Remote tmux does not survive by default.

### tmux session is killed

The processes inside that tmux session are killed.

## Minimal mental model

Only these tmux concepts should matter in phase 1:

```text
session = durable workspace
window  = durable tab
pane    = durable split
picker  = find and jump
```

## Required tmux action set

The workflow should support only a very small set of tmux actions.

### Required actions

1. Open picker

Show sessions, windows, and panes. Let the user jump to one.

2. New window

Create a new durable tab inside the current tmux session.

3. Close current pane/window

Close the current pane or window safely.

The close behavior must be explicit and should avoid accidental destruction.

4. Previous window

Move to the previous durable tab.

5. Next window

Move to the next durable tab.

6. Split right

Create a side-by-side pane.

7. Split down

Create a top/bottom pane.

8. Zoom/unzoom pane

Temporarily make the current pane full screen, then restore layout.

9. Detach

Leave tmux without killing the session.

10. Rename

Rename current window or session to improve clarity.

## Not required in phase 1

The user does not want or need the following in the initial model:

- pane movement
- pane resizing keybindings
- synchronized panes
- tmux copy-mode mastery
- paste buffer management
- complex layout algorithms
- session groups
- hooks
- deep tmux scripting
- nested tmux
- large plugin suites
- full tmux resurrection after host reboot
- vi/HJKL navigation
- Super-1..9 navigation
- memorizing default tmux keybindings

## Ergonomic requirement

High-frequency actions should not require Ctrl-based chords as the primary workflow.

The user strongly dislikes Ctrl-heavy keybindings for frequent operations.

Ctrl-based bindings are acceptable for:

- standard terminal semantics
- rare or deliberate actions
- fallback access
- discoverability/help trigger
- recovery
- compatibility in non-primary terminals

Ctrl-based bindings are not acceptable as the main workflow for:

- new window
- close window/pane
- previous/next window
- split right
- split down
- common navigation

## Preferred keybinding architecture

There may be two layers.

### Primary ergonomic layer

The primary terminal emulator, such as Ghostty, may translate Cmd/Super-style bindings into tmux actions.

This is the desired normal workflow when using the primary terminal.

### Portable fallback layer

tmux should still provide a small fallback prefix or discoverability mechanism for non-primary terminals, dumb terminals, or recovery.

The fallback can be less ergonomic because it is not the main workflow.

## Terminal-mediated tmux control

The desired model is:

```text
local client receives Cmd/Super key
  -> client translates key to tmux-compatible input
    -> input reaches local or remote tmux
      -> tmux performs action
```

For remote tmux over SSH:

```text
Ghostty on local machine
  -> translates Cmd/Super binding
    -> SSH transports normal terminal bytes
      -> remote tmux receives action
```

The remote host does not need to understand Cmd or Super.

The local client and local desktop/compositor must allow the relevant keybindings to reach the terminal emulator.

## Linux compositor caveat

On Linux, Super-key bindings may be intercepted by the desktop/compositor before the terminal emulator receives them.

Therefore the system must be able to test whether a desired terminal-focused Super binding is:

- delivered to the terminal emulator
- intercepted by the desktop/compositor
- conflicting with an existing global shortcut
- unavailable
- remappable

If a binding is intercepted, the system should propose one of:

- remove or reassign the desktop shortcut
- choose another terminal-focused binding
- use the fallback tmux mechanism

## Discoverability requirement

tmux must be discoverable.

The user should not need to memorize a large set of tmux commands.

Required discoverability features:

- a picker for sessions/windows/panes
- a curated help screen showing the small supported keymap
- a visible session name
- a visible window list
- a visible indication of current host or context if practical
- a visible indication of attached client count if practical
- a visible prefix/fallback state if practical

Desired style:

- similar spirit to VS Code Cmd-P / command palette
- fuzzy search is acceptable
- picker should be the main escape hatch

## Chrome/status-line requirement

tmux chrome should be functional and minimal.

It should help answer:

- where am I?
- which host/session is this?
- which window/task is active?
- are there other clients attached?
- am I in prefix/fallback mode?
- what are my available windows?

The status line may be top or bottom.

It should not become a heavy theme project in phase 1.

## Plugin stance

Plugins are allowed but not required.

Phase 1 should not depend on a large plugin ecosystem unless it directly enables the minimal workflow.

Potentially useful plugin categories:

- fuzzy picker
- session/window/pane search
- lightweight status/chrome
- later: tmux persistence/resurrection

Out of scope for phase 1:

- heavy theme frameworks
- large tmux distributions
- plugin-heavy workflows
- automatic resurrection after reboot unless explicitly chosen later

## Success criteria

This tmux workflow succeeds if:

- The user only needs to understand client, SSH, tmux session, tmux window, and tmux pane.
- tmux is used as durable state, not as a full desktop environment.
- The required action set fits on one help screen.
- High-frequency actions do not require Ctrl-heavy chords as the primary workflow.
- The workflow works locally and over SSH.
- Remote work survives local terminal or SSH disconnects.
- The user can always open a picker to find sessions/windows/panes.
- The user can ignore 99% of tmux.
