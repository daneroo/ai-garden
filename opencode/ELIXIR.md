# Phoenix + Ash + LiveView + SQLite

## Igniter bootstrap

```bash
# 0 - Pre-reqs
# - Elixir/Erlang, Node, SQLite tooling available on PATH
for cmd in elixir erl mix node sqlite3; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "missing: $cmd"; exit 1; }
done

# 1- Install igniter_new archive only if missing
# ref: Igniter docs :contentReference[oaicite:0]{index=0}
mix archive | grep -qE '(^|/)igniter_new-[0-9]' \
  || mix archive.install hex igniter_new --force


# 2 - Generate Phoenix app (directory must NOT already exist)
# ref: mix igniter.new flags: --with/--with-args/--install :contentReference[oaicite:1]{index=1}
mix igniter.new my_app \
  --with phx.new \
  --with-args="--no-ecto" \
  --install ash,ash_phoenix,ash_sqlite \
  --yes

cd my_app

# 3) If you didn’t use --install (or want to re-run installers)
# ref: igniter.install runs <pkg>.install tasks when present :contentReference[oaicite:2]{index=2}
mix igniter.install ash ash_phoenix ash_sqlite --yes

# 4) Run
mix phx.server

# 5) Generate LiveView CRUD (domain + resource must already exist)
# ref: ash_phoenix.gen.live :contentReference[oaicite:3]{index=3}
mix ash_phoenix.gen.live --domain MyApp.Shop --resource MyApp.Shop.Product
```

## Core idea

- Igniter is Ash’s project-patching + code-modification toolkit (semantic edits,
  not string templates). :contentReference[oaicite:0]{index=0}
- It powers “installers” and “upgraders” that can modify an existing project
  safely (deps, config, files, refactors) like codemods.
  :contentReference[oaicite:1]{index=1}

## What you use as an app author

- `mix igniter.new`: create a new project and optionally run installers.
  :contentReference[oaicite:2]{index=2}
- `mix igniter.install <package>`: add dep + run that package’s installer (if it
  has one). :contentReference[oaicite:3]{index=3}
- “Upgraders”: upgrade deps and apply codemods together.
  :contentReference[oaicite:4]{index=4}
- “Refactors”: built-in codemod-style edits (e.g., rename function).
  :contentReference[oaicite:5]{index=5}

## Phoenix + Ash + SQLite (common pattern)

- Create Phoenix app via Igniter, and install Ash packages in one shot:
  - `mix igniter.new my_app --with phx.new --with-args="--no-ecto" --install ash,ash_sqlite,ash_phoenix`
    :contentReference[oaicite:6]{index=6}
- SQLite via Ash uses an installer intended to run through Igniter:
  - `mix igniter.install ash_sqlite` (runs `mix ash_sqlite.install` under the
    hood). :contentReference[oaicite:7]{index=7}

## “Generative magic” after install (LiveView scaffolding)

- Generate LiveView CRUD screens from an existing domain + resource:
  - `mix ash_phoenix.gen.live --domain MyApp.Shop --resource MyApp.Shop.Product`
    :contentReference[oaicite:8]{index=8}
- Note: the domain/resource must already exist (generator doesn’t define them).
  :contentReference[oaicite:9]{index=9}

## Mental model (succinct)

- Phoenix generator: scaffolds a new app.
- Igniter: applies codemods/installers/upgrades to your app.
- Ash generators: scaffold domain/resources/LiveViews on top of that.
