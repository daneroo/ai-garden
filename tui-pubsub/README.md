# TUI over pubsub demo

*WIP:* Perfecting the idea of jsonl output -> web UI

Thjs shows how we can:

- publish each line to a nats subject to which a web page: `nats-sub.html` is subscribed.
- Have a web page simply poll a jsonl file, which is served statically: data/data.jsonl

## Nats

```bash
docker compose up -d

# look at the nats server if you want!
# open http://localhost:8222/
# open the nats-sub.html file in your browser
open http://localhost:9876/nats-sub.html
pnpx serve -l 9876 .

docker compose down

```

Now independently start the clock -> nats

```bash
pnpx tsx index.ts | while IFS= read -r line; do nats pub clock "$line"; done
```

## JSONL viewer

This serves the whole dir statically:

- jsonl-poll.html (includes our jsonl viewer)
- data/data.jsonl (our jsonl file)

```bash
open http://localhost:9876/jsonl-poll.html
pnpx serve -l 9876 .
```

Now independently start the clock

```bash
pnpx tsx index.ts > data/data.jsonl
```
