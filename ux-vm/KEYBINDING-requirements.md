# KEYBINDING Requirements

## Objective

Create a reproducible, testable command-key and terminal-workspace configuration that makes Linux desktop usage feel close enough to macOS for high-frequency actions, while preserving Unix terminal behavior and enabling a Ghostty + tmux + SSH pane-of-glass workflow across local and homelab machines.

The desired outcome is not a perfect clone of macOS. The desired outcome is a small, explicit, high-value set of keyboard behaviors that make Linux desktop migration practical again.

## Core principle

Desired behavior is declared once. Backend-specific implementation may be ugly, desktop-specific, app-specific, or OS-specific, but it must be generated, checked, backed up, and reported by tooling.

The user should not manually manage backend-specific details.

Implementation complexity is acceptable. Unclear state is not.

## Product definition

The product is not a dotfiles repo, a Nix module, a chezmoi setup, or a collection of shell scripts.

The product is:

- A declarative behavioral specification for desktop keybindings and terminal workspace behavior.
- A way to check whether a given machine conforms to that specification.
- A way to detect conflicts.
- A way to propose changes.
- A way to apply changes safely.
- A way to roll back changes.
- A way to report partial support, skipped optional bindings, and hard blockers.

## Non-goals

- Do not implement vi/HJKL desktop navigation.
- Do not require Super-1..9 workspace switching.
- Do not make Super-1..9 part of the default mental model.
- Do not remap Ctrl-C/Ctrl-D/Ctrl-Z away from standard terminal semantics.
- Do not make Ctrl-C copy in terminals.
- Do not require manual GUI click-ops as the durable source of truth.
- Do not require all operating systems, desktops, or apps to implement behavior the same way.
- Do not require the implementation to be elegant.
- Do not require a single universal backend.
- Do not depend on terminal emulator session restore as the durable process model.
- Do not require full tmux resurrection after remote host reboot in the first phase.

## Terminology

Use these conceptual names in the design:

- `Super`: Linux equivalent of macOS `Cmd`, often the Windows/Meta key.
- `Cmd-like`: Desired macOS-style command-key behavior implemented using `Super` on Linux.
- `Desktop/compositor`: GNOME Shell, KDE/KWin, Hyprland, or equivalent.
- `Terminal viewport`: Ghostty or another terminal app used as the visual entry point.
- `Durable terminal workspace`: tmux session/window/pane topology.
- `Pane of glass`: A single local terminal app providing access to local and remote durable sessions.
- `Backend`: Any system used to realize the behavior, such as Nix, chezmoi, stow, dconf, gsettings, KDE config, Hyprland config, Ghostty config, tmux config, SSH config, or app-specific settings.

## Required keybindings

### Launcher and quick access

| Desired binding     | Required behavior                                                            |
| ------------------- | ---------------------------------------------------------------------------- |
| `Super-Space`       | Open primary launcher / Raycast equivalent.                                  |
| `Super-Shift-Space` | Open 1Password quick access/search if 1Password is installed and configured. |

### Clipboard

| Desired binding | Required behavior               |
| --------------- | ------------------------------- |
| `Super-X`       | Cut where cut is supported.     |
| `Super-C`       | Copy where copy is supported.   |
| `Super-V`       | Paste where paste is supported. |

Terminal-specific clipboard requirements:

- In terminals, `Super-C` must copy selected terminal text.
- In terminals, `Super-V` must paste clipboard content into the terminal.
- In terminals, `Ctrl-C` must remain SIGINT/interruption.
- In terminals, `Ctrl-D` must remain EOF.
- In terminals, `Ctrl-Z` must remain suspend.
- The terminal emulator may own `Super-C` and `Super-V` locally.
- Remote shells must not be required to understand the Super modifier for basic paste behavior.

### Lifecycle

| Desired binding | Required behavior                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Super-N`       | New window, new item, or equivalent where supported.                                                                  |
| `Super-W`       | Close current tab/window where supported.                                                                             |
| `Super-Q`       | Quit app where supported. Acceptable fallback: close focused window if app-level quit cannot be externally expressed. |

Notes:

- Linux often separates “close focused window” from “quit application” less cleanly than macOS.
- The system must distinguish true app quit from close-window fallback in reports.
- Fallback behavior must be explicit, not hidden.

### Tabs

| Desired binding | Required behavior                     |
| --------------- | ------------------------------------- |
| `Super-Shift-[` | Previous tab where app supports tabs. |
| `Super-Shift-]` | Next tab where app supports tabs.     |

Notes:

- This must be tested at least in Ghostty and a Chromium-family browser such as Brave/Chrome, where applicable.
- If an app does not expose tabs, the binding may be skipped for that app.
- App-specific behavior is acceptable if declared and testable.

### Windows

| Desired binding  | Required behavior                                           |
| ---------------- | ----------------------------------------------------------- |
| `Super-Backtick` | Cycle windows belonging to the current app where supported. |
| `Super-Tab`      | Cycle apps/windows.                                         |

Notes:

- `Super-Backtick` is intended to mirror macOS same-app window cycling.
- If a Linux desktop cannot express “same app” grouping cleanly, the implementation must report the closest equivalent and mark the result as partial or blocked.
- `Super-Tab` may be owned by the desktop/compositor.

### Workspaces

| Desired binding | Required behavior          |
| --------------- | -------------------------- |
| `Ctrl-Left`     | Previous workspace/screen. |
| `Ctrl-Right`    | Next workspace/screen.     |

Explicitly not required:

- `Super-1..9` for workspaces.
- HJKL workspace or focus navigation.

## Desired mental model

The desired keyboard model is:

- `Super` is the desktop/app command layer.
- `Ctrl` remains the terminal/editor/program layer.
- `Alt` remains available for app menus, alternate commands, and desktop-specific behavior.
- tmux uses its own explicit prefix model for durable terminal topology.

This preserves Unix terminal behavior while making GUI-level interactions more Mac-like.

## Terminal cockpit requirements

### Primary goal

Ghostty, or equivalent terminal emulator, should serve as the primary visual pane of glass.

tmux should serve as the durable session/window/pane layer.

SSH should serve as the transport to remote systems.

### Required behavior

- Local terminal sessions can attach to named tmux workspaces.
- Remote SSH sessions can attach to named tmux workspaces.
- Remote one-off SSH remains possible without ceremony.
- Long-running remote work survives local terminal/app disconnect.
- Local terminal app restart should not destroy active tmux-managed processes.
- SSH disconnect should not destroy active remote tmux-managed processes.
- Remote host reboot persistence is out of scope for the first phase.

### Terminal invariant

This invariant is central:

```text
Ctrl-C in terminal remains SIGINT.
Super-C in terminal copies.
Super-V in terminal pastes.
tmux provides durable topology.
Ghostty provides the viewport.
SSH provides the transport.
```

## tmux requirements

tmux should be used as a backend for durable terminal state, not necessarily as the primary user-facing UX.

### Required tmux capabilities

- Stable prefix.
- Attach-or-create workflow.
- Named sessions.
- Optional session picker.
- Ability to show attached client counts.
- Ability to reattach after terminal or SSH disconnect.
- Consistent config across machines where practical.

### Suggested tmux concepts

- tmux session: durable workspace.
- tmux window: durable task tab.
- tmux pane: durable split for closely related processes.
- tmux client: disposable attached view.

### Desired session naming

The exact format may evolve, but the system must support stable, deterministic names.

Examples:

```text
local:<host>:<project>
remote:<host>:<purpose>
dev:<host>:<repo>:<worktree>
ops:<host>
```

### Desired terminal hierarchy

Use this conceptual hierarchy:

```text
Ghostty window/tab
  disposable viewport into a world

tmux session
  durable workspace for a host/project/purpose

tmux window
  task-level tab inside that durable workspace

tmux pane
  split for tightly related processes
```

Avoid this as the default model:

```text
one GUI tab = one tmux session
one Ghostty split = one unrelated tmux session
nested multiplexers for the same scope
```

## Desktop and OS support requirements

The system may support multiple backends. Each backend may be bespoke.

Potential targets:

- macOS
- KDE Plasma
- GNOME / Bluefin
- Hyprland / Omarchy
- NixOS
- Ubuntu
- Fedora-family systems
- Other Linux distributions as practical

The first backend does not need to support all environments, but the requirements model must allow per-OS and per-desktop behavior.

## Declarative requirements

### Source of truth

Desired behavior must live in a repo.

The source of truth may be any practical format:

- YAML
- TOML
- JSON
- Nix
- chezmoi data
- another explicit structured format

The source of truth must express desired behavior, not merely incidental implementation details.

### Acceptable implementation backends

The system may use any combination of:

- Nix / Home Manager
- chezmoi
- stow
- bespoke shell scripts
- gsettings
- dconf
- KDE config files
- KWin shortcuts
- Hyprland config
- Ghostty config
- tmux config
- SSH config
- app-specific config files
- app-specific databases
- command-line tools
- UI automation / computer-use automation where necessary

Implementation ugliness is acceptable if it is hidden behind check/propose/apply/report tooling.

### Chezmoi and stow stance

- stow is acceptable for single-machine dotfile linking.
- chezmoi is acceptable for cross-machine dotfile management.
- chezmoi templating is optional and should not be required unless it solves a clear problem.
- Nix is preferred where available for declarative host state and rollback.
- None of these tools alone defines the product.

## Validation requirements

The system must be able to answer:

```text
Does this machine currently satisfy the desired behavior?
```

### Required validation commands

The exact command names may vary, but the system must support equivalent operations:

- `doctor`: identify OS, desktop, compositor, terminal, launcher, shell, tmux, and relevant apps.
- `check`: verify current state against desired behavior.
- `conflicts`: list conflicts between desired bindings and current bindings.
- `explain <binding>`: show which layer owns a binding and what it should do.
- `diff` or `propose`: show proposed changes before applying.
- `apply`: apply changes safely.
- `backup`: back up affected state.
- `restore`: restore previous state where possible.
- `report`: produce human-readable and machine-readable conformance reports.

### Validation statuses

Every desired binding must report one of:

| Status            | Meaning                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `PASS`            | Verified through documented config, API, CLI, or observed state.                                                   |
| `PASS-OPTIMISTIC` | Verified by inspecting observed app config/state or behavior after setting it through UI or another fallback path. |
| `MISSING`         | Desired behavior is absent.                                                                                        |
| `CONFLICT`        | Desired key is already assigned to another known action.                                                           |
| `PARTIAL`         | Behavior works in some required contexts but not all.                                                              |
| `SKIPPED`         | Conditional dependency is absent, such as 1Password not installed.                                                 |
| `BLOCKED`         | Configuration or verification failed because of a documented hard blocker.                                         |

`UNKNOWN` is not acceptable as a final steady-state report.

If behavior cannot be verified, the tool must classify it as `BLOCKED` and include:

- attempted methods,
- observed results,
- relevant files/settings inspected,
- reason verification could not proceed,
- proposed next investigation step if any.

## Conflict detection requirements

Before applying changes, the system must detect conflicts.

For every conflict, report:

- Desired binding.
- Current owner.
- Current action.
- Desired owner.
- Desired action.
- Proposed resolution.
- Risk level.
- Whether a restart, logout, app reload, or compositor reload is required.

Example conflicts:

```text
Super-Space is already bound to desktop overview.
Super-Tab is reserved by compositor.
Super-Q conflicts with close-window action.
Ctrl-Right already maps to a different workspace action.
Super-C is captured by terminal emulator rather than passed to app.
Super-Shift-Space is already used by another desktop shortcut.
```

## Proposal-before-mutation requirements

The system must support dry-run/proposal behavior.

Before applying changes, it must show:

- files to edit,
- commands to run,
- settings to change,
- app-specific settings to touch,
- backups to create,
- expected reload/restart/logout requirements,
- known risks,
- bindings that will remain partial/skipped/blocked.

The system must not silently overwrite user state.

## Rollback requirements

Every mutation must be reversible where possible.

### File-backed config

- Back up original file before mutation.
- Show diff before applying.
- Prefer git-tracked repo changes where practical.

### dconf/gsettings

- Export relevant paths before mutation.
- Store export with timestamp.
- Provide restore instructions or restore command.

### Nix

- Use Nix generations as rollback path.
- Report generation changes.

### chezmoi/stow

- Show git diff before apply.
- Avoid destructive overwrites unless explicitly approved.
- Preserve unmanaged files where possible.

## Computer-use fallback requirement

When a desired behavior is only configurable through an application UI, automated computer-use is an acceptable fallback.

The system may:

- open the relevant settings UI,
- apply the desired setting,
- record what changed,
- inspect files/settings before and after,
- produce a reusable detector or optimistic assertion,
- run a behavioral test if possible.

UI automation is not the preferred source of truth, but it is acceptable as a bootstrap path when the final state can be inspected or behaviorally tested afterward.

## Verification principle

Every desired behavior must have a verification strategy.

Preferred strategies, in order:

1. Documented declarative configuration.
2. Documented CLI/API.
3. Settings database inspection.
4. Config file inspection.
5. App-specific state inspection.
6. Computer-use automation followed by config/state inspection.
7. Behavioral test.
8. `BLOCKED` with documented hard blocker.

`Cannot be verified` is not acceptable as an undocumented conclusion.

## Conditional application requirements

Some bindings depend on installed software.

### 1Password

Desired binding:

```text
Super-Shift-Space opens 1Password quick access/search if 1Password is installed and configured.
```

Validation:

| Status            | Meaning                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `PASS`            | 1Password binding verified through documented config/API/CLI or observed state.                              |
| `PASS-OPTIMISTIC` | Binding set through UI or desktop settings and verified through observed config/state or automated behavior. |
| `MISSING`         | 1Password is installed but the binding is not configured.                                                    |
| `CONFLICT`        | `Super-Shift-Space` is already owned by another binding.                                                     |
| `SKIPPED`         | 1Password is not installed.                                                                                  |
| `BLOCKED`         | App/system prevents setting or verifying the shortcut, with blocker documented.                              |

## App-specific requirements

The system must classify app-specific behavior as one of:

- managed,
- unmanaged but compatible,
- unsupported,
- skipped,
- blocked.

Apps of interest include at least:

- Ghostty
- Brave or another Chromium-family browser
- 1Password
- launcher/Raycast-equivalent
- terminal shell
- tmux
- desktop/compositor

Optional future apps:

- VS Code / Cursor
- Electron apps
- file manager
- password manager alternatives
- browser alternatives

## Ghostty requirements

Ghostty should support the terminal-side behavior.

Required Ghostty behavior:

- `Super-C`: copy terminal selection.
- `Super-V`: paste clipboard into terminal.
- `Super-Shift-[`: previous tab, if Ghostty tabs are used.
- `Super-Shift-]`: next tab, if Ghostty tabs are used.
- `Super-N`: new window/tab/surface according to configured preference.
- `Super-W`: close tab/window/surface according to configured preference.

Ghostty should be treated primarily as the viewport, not as the durable process/session manager.

## Launcher requirements

`Super-Space` must open the chosen launcher.

Launcher candidates may include:

- KRunner
- GNOME overview/search
- Walker
- Rofi
- Wofi
- Ulauncher
- Albert
- Raycast-equivalent Linux launcher
- OS-specific equivalent

The selected launcher must be declared per machine or per desktop backend.

## Workspace requirements

`Ctrl-Left` and `Ctrl-Right` must move to previous/next workspace or screen.

The implementation must avoid requiring workspace numbers.

The implementation must not require HJKL.

If a desktop uses dynamic workspaces, the behavior should map to previous/next dynamic workspace.

If a desktop uses fixed workspaces, the behavior should map to previous/next fixed workspace.

## Same-app window cycling requirement

`Super-Backtick` should cycle through windows of the current application where the desktop supports app grouping.

If exact same-app cycling is not expressible, the system must report:

- closest available behavior,
- whether app grouping is available,
- whether the result is partial or blocked.

## Super-Tab requirement

`Super-Tab` should cycle apps/windows.

The implementation must define which one is used on the selected desktop:

- cycle applications,
- cycle windows,
- cycle grouped windows,
- show switcher/overview.

The behavior must be documented per backend.

## Super-Q requirement

`Super-Q` should quit the app where possible.

Acceptable fallback:

- close focused window.

The system must report whether the binding is true app quit or close-window fallback.

## Testability requirements

The test system should produce both human-readable and machine-readable reports.

Example report format:

```text
PASS             Super-Space          launcher                 KDE/KRunner
PASS             Super-C              Ghostty copy             ghostty config
PASS             Super-V              Ghostty paste            ghostty config
PASS-OPTIMISTIC  Super-Shift-Space    1Password quick access   observed app config
PARTIAL          Super-Q              quit app                 implemented as close focused window
SKIPPED          1Password binding    dependency absent        1Password not installed
BLOCKED          Super-Backtick       same-app cycle           backend lacks app-group switch action
```

Machine-readable output should include:

- binding,
- desired behavior,
- backend,
- status,
- current owner,
- current action,
- proposed action,
- evidence,
- risk,
- notes.

## Phase 1 scope

Phase 1 should validate feasibility and implement the smallest useful stack.

Suggested Phase 1 scope:

- One Linux desktop target.
- Ghostty.
- tmux.
- SSH aliases.
- Launcher binding.
- Clipboard bindings.
- Tab navigation bindings.
- Workspace navigation bindings.
- 1Password conditional binding.
- Validation report.
- Conflict detection.
- Dry-run/proposal mode.
- Safe apply with backup.

Phase 1 does not need:

- every desktop backend,
- every app,
- perfect app-level quit everywhere,
- full reboot resurrection,
- cross-machine tmux layout restore,
- polished UI.

## Phase 2 scope

Possible Phase 2 items:

- Additional desktop backends.
- App-specific shortcut management.
- Computer-use automation for apps without documented config.
- Observed-state verifiers for app UI settings.
- tmux session picker.
- tmux attached-client reporting.
- remote dev-machine profiles.
- Nix/Home Manager module.
- chezmoi integration.
- richer conformance reports.

## Success criteria

This project succeeds when:

- The desired keybindings are written once in a repo.
- A fresh or existing machine can be checked for conformance.
- Conflicts are reported before changes.
- Changes can be proposed before applying.
- Changes can be applied safely.
- Changes can be rolled back.
- Terminal semantics remain intact.
- Ghostty + tmux + SSH can serve as a single pane of glass.
- The user does not manually manage per-backend details.
- Any unsupported behavior is honestly classified as partial, skipped, or blocked.

## Current required keybinding tally

```text
Launcher / quick access:
  Super-Space          launcher / Raycast equivalent
  Super-Shift-Space    1Password quick access, if available

Clipboard:
  Super-X              cut
  Super-C              copy
  Super-V              paste

Lifecycle:
  Super-N              new window / new item
  Super-W              close window/tab
  Super-Q              quit app / close app fallback

Tabs:
  Super-Shift-[        previous tab
  Super-Shift-]        next tab

Windows:
  Super-Backtick       cycle windows of current app
  Super-Tab            cycle apps/windows

Workspaces:
  Ctrl-Left            previous workspace/screen
  Ctrl-Right           next workspace/screen
```

## Current rejected assumptions

```text
No Super-1..9 workspace model.
No HJKL navigation.
No vi-compatible desktop requirement.
No Ctrl-C-as-copy in terminals.
No manual GUI click-ops as source of truth.
No single-backend purity requirement.
No need for elegant implementation.
```
