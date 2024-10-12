# uv & ruff

Just trying to get rid of poetry

## TODO

- [ ] Python related extensions, lsp format on save, linter
  - [ ] confirm for cursor
  - [ ] confirm for VSCode

## Extensions

- Pylance
- Python
- Python Debugger

## Setup

```bash
uv init uv-one
cd uv-one
uv run hello.py
uv add requests
uv run hello.py
```

## Ruff

Not sure about extensions yet. Seems to be a problem in Cursor.

```bash
ruff check
ruff format --check
ruff format
```
