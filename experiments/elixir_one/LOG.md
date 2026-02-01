# OpenCode Bootstrap Summary

## Progress

- Step 0 (pre-reqs): not checked yet.
- Step 1 (install `igniter_new`): done (also updated Hex).
- Step 2 (generate app): done in `experiments/elixir_one` using:
  - `mix igniter.new experiments/elixir_one --module ElixirOne --with phx.new --with-args="--no-ecto" --install ash,ash_phoenix,ash_sqlite --yes`
- Step 3 (installers): not needed because `--install` was used.
- Step 4 (run server): run and verified.
- Step 5 (LiveView CRUD): not run yet.

## Notes

- Installed `phx_new` archive (required for `phx.new`).
- Ash SQLite warned about missing domains, so no migrations were generated.
- Project folder is `experiments/elixir_one` (canonical app name).
- SQLite database moved into `data/` and config updated for dev/test.
- Added `/data/` to `.gitignore` and removed stray `experiments/path/to/your.db*` files.
- `mix igniter.new` ran without `--no-git`, so it created a commit in the parent repo.
