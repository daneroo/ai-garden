# Bookplayer for Prosodio

- We are still in ai-garden here
- We want to plan for a new app in the (nested git mono repo prosodio/)

Help me write a great prompt for Claude Fable to make a precise plan in
`prosdio/throuths/plans/bookplayer.md`

- The bookplayer must live in the `prosodio/apps/bookplayer` directory of the
  monorepo - it's a new app.
- we want to gather the requirement based on multiple experiments we made (see
  ai-garden/experiments/seeds/bookplayer.md) and the three implementatrions we
  made with that plan, each of these realised experiments, had a PLAN.md file
  with it's learnings
  - `ai-garden/experiments/bookplayer-agy-opus46/`: best
  - `ai-garden/experiments/bookplayer-claude-opus-46/`: best working player
  - `ai-garden/experiments/bookplayer-codex-gpt-5.3-codex/`: strong CI disipline

So we want to write a great prompt, so that Claude Fable 5 can:

- make a detaled design and plan
  (`prosodio/thought/{plans|design}/bookplayer.md`)
- and that plan will lead to an implementation in `prosodio/apps/bookplayer/`

Your job is to make a reat prompt explaing the context for Claude Fable 5 Write
the promps in `ai-garden/plans/BOOKPLAYER-fable5-prompt-by-agy.md`

We want to balance: reusing all our experiments, but not overly constrain the
new bookplayer design, or repeat subotptimal designe we may have made.

We could include screenshots e.g.

- `cd ai-garden/experiments/bookplayer-claude-opus-46/; bun run dev; #take a screen shot of the player`
- `cd ai-garden/experiments/bookplayer-agy-opus46/; bun run dev; #take a screen shot of the player`
