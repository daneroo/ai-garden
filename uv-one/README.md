# Python with uv & ruff

Just trying to get rid of poetry

## TODO

- [ ] Add testing (tools?)

## Python Project Setup

```bash
uv init uv-one
cd uv-one
uv run hello.py
uv add requests
uv run hello.py
```

## VSCode Extensions

- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- Python Environment Manager (donjayamanne.python-environment-manager)
- Ruff (charliermarsh.ruff)
and User Settings

```json
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnType": true
  },
```

## Tasks

```bash
Available recipes:
    cleanup      # Remove virtual environment
    format-check # Check formatting using ruff
    format-fix   # Format using ruff
    help         # List just commands
    info         # Display information about the virtual environment, and python version
    lint         # Lint using ruff
    outdated     # List outdated dependencies
    run *args    # Run the app with (zero * or more) args
    sync         # Update the project's environment
    upgrade      # Update dependencies
```
