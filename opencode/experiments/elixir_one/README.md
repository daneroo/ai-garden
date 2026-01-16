# ElixirOne

## Experiment Goal

- Bootstrap Phoenix + Ash + LiveView + SQLite app using Igniter.

## TODO

- [ ] Add `.m4b` diration and metadata to the scanner/library.
  - [ ] decide if we use `ffmpex` or raw `ffprobe` command

## Tidewave Setup

Dependency in `mix.exs`:

```elixir
{:tidewave, "~> 0.5", only: :dev}
```

Endpoint Plug in `lib/elixir_one_web/endpoint.ex`:

```elixir
if Code.ensure_loaded?(Tidewave) do
  plug Tidewave
end
```

## Running the server

- Run `mix setup` to install and setup dependencies.
- Set `AUDIOBOOKS_ROOT_DIR` to your audiobooks directory (defaults to `/Volumes/Space/Reading/audiobooks`).
- Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`.

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## Learn more

- Official website: https://www.phoenixframework.org/
- Guides: https://hexdocs.pm/phoenix/overview.html
- Docs: https://hexdocs.pm/phoenix
- Forum: https://elixirforum.com/c/phoenix-forum
- Source: https://github.com/phoenixframework/phoenix
