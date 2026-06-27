# Codex review: prosodio consolidation

Status: review for Daniel and Claude Code

Date: 2026-06-27

Scope: review of [`CONSOLIDATING-prosodio.md`](./CONSOLIDATING-prosodio.md),
including Daniel's answers to the first Codex review. This file does not replace the
main plan and does not authorize repository creation or code migration.

## Executive assessment

The plan has enough context to begin converging, but it is not yet internally reliable
as an execution plan. Its strongest material is the source inventory, the reasons for
leaving ai-garden, and the explicit record of uncertainty. Its weakest material is
decision state: verified evidence, Daniel-approved decisions, provisional defaults,
open proposals, and stale text are mixed together.

Daniel's answers establish a credible initial sequence:

- Seed a minimal public prosodio repository with a maintainable documentation and agent
  instruction structure.
- Port `bun-one/apps/whisper` first and rationalize its corpus, fixture, generated
  output, and performance-evaluation boundaries.
- Port `epub-validate` second, preserving its validated parser-comparison capability
  while separating it from the future production EPUB-consumption abstraction.
- Include the useful `nx-audiobook` validation capability in the long-term plan, likely
  early but not as an initial target.
- Treat `audio-deno-match` as a possible later Bun port and alignment research input.
- Do not prematurely specify word-level alignment details in this consolidation plan.

The plan should be corrected and narrowed around that sequence before seeding the new
repository. Tooling choices that are not needed for the first port may remain
provisional.

## Confirmed direction from Daniel

These points should graduate into the main plan as decisions or explicit scope:

- The first product milestone is a working reproduction of
  `bun-one/apps/whisper`, not an extracted VTT package or an end-to-end player.
- The first port includes rational decisions about private corpora, public fixtures,
  generated results, and performance evaluations.
- `epub-validate` is the expected second major port.
- `audio-deno-match` is a candidate after conversion to the Bun architecture; it is not
  mature alignment architecture.
- The eventual target is word-level alignment between audiobook transcription and
  ebook content, but its location model, metrics, confidence representation, and other
  detailed contracts require separate research and are premature here.
- `ParserOutput` is validated for parser parity evaluation. It may inform, but should
  not automatically become, the downstream ebook-consumption API.
- epubts-node is the current production candidate. It must sit behind an abstraction
  because the implementation is expected to evolve or be replaced.
- The EPUB abstraction is also a concrete test of monorepo dependency policy: shared
  dependency versions, package versus peer dependencies, runtime isolation, and dead
  dependency detection.
- prosodio will be public. The real corpora and, as far as practical, identifying or
  derived corpus reports must remain private.
- A clean port does not preserve source Git history. It preserves provenance and
  behavior while allowing the minimum changes required by the new workspace,
  configuration, and corpus boundaries.
- The useful audiobook validation capability from `nx-audiobook` belongs in prosodio's
  long-term plan. It is likely an early capability but not one of the first two ports.
- AI harness support is exploratory and expected to evolve. The immediate need is a
  maintainable relationship among `AGENTS.md`, `CLAUDE.md`, plain documentation,
  skills, and harness-specific configuration—not a claim that all harnesses are
  equivalent.

## Corrections required in the main plan

### Migration order contradicts the inventory

The current migration order starts with a clean VTT port and later says to deduplicate
VTT while porting whisper. Earlier sections correctly state that the trusted VTT code
lives inside whisper and should only be extracted when a real second consumer requires
it.

Replace the current first three migration steps with this direction:

- Port `bun-one/apps/whisper` as `apps/transcribe` or another agreed name, retaining its
  internal VTT implementation.
- Establish public fixtures, private corpus configuration, generated-output policy, and
  performance-evaluation policy as part of that port.
- Port and reshape `epub-validate` after the first application proves the workspace and
  data-boundary conventions.
- Extract VTT or transcription packages later only when another actual consumer makes
  the boundary clear.

### The EPUB parser choice is no longer wholly open

The main plan lists selection of a canonical EPUB parser as open. The validated
[`FINDINGS-epub-validate-2026-06-24.md`](../epub-validate/docs/FINDINGS-epub-validate-2026-06-24.md)
already selects:

- epubts-node as the current pipeline implementation;
- epubts-browser as the reference implementation for detecting node-path defects;
- Storyteller as an independent, scoped validator and possible interoperability path.

The remaining open decision is not which implementation wins the current evaluation.
It is how to expose a swappable production EPUB API without confusing it with the
parser-parity observation schema.

### Axis and completion text is stale

The plan defines five axes but later refers to four axes and finally three axes. Its
verification section also says every component has a verdict while several entries
remain `ASSESS`. These are mechanical corrections, but they matter because the document
claims to be the single current planning authority.

### Decision state is ambiguous

The blanket rule that everything not marked `VALIDATED` is an assumption is too coarse.
Validation and commitment are independent:

- A fact can be verified or assumed.
- A proposal can be evidence-backed without being accepted.
- Daniel can make a decision provisionally before it is validated in production.
- A formerly correct decision can become superseded.

For consequential items, record at least:

```text
State: decided | provisional | proposed | open | deferred | superseded
Evidence: verified source or explicit "not yet validated"
Rationale: why this choice currently wins
Revisit when: concrete trigger, not merely "later"
```

This does not need to appear on every bullet. It should appear in the decision log and
in focused decision records.

### The tentative repository layout is ahead of the evidence

The proposed fourth top-level category for backend-bound code is not yet justified by a
port. Runtime boundaries are real, but a new repository-wide category is only one
possible enforcement mechanism. Package exports, dependency rules, naming, lint checks,
and framework-specific entry points may be sufficient.

Keep the requirement—backend-only dependencies must not enter browser graphs—but defer
the fourth category until the first concrete package boundary needs it.

## Durable documentation and planning structure

No single file should be the source of truth for every kind of information. The durable
approach is to give each information type one authoritative home and an explicit
lifecycle.

Recommended initial structure:

```text
prosodio/
  AGENTS.md
  CLAUDE.md                 # thin harness pointer/import, if needed
  README.md
  docs/
    README.md               # documentation map and authority rules
    architecture/
      overview.md           # current system and package boundaries
    decisions/
      0001-bun-workspace.md  # one durable decision per ADR
      0002-*.md
    development/
      workspace.md
      testing.md
      private-data.md
      ai-harnesses.md
    provenance.md            # source repo/path/SHA and migration notes
  plans/
    active/
    archive/
```

The exact names are less important than the authority boundaries:

- `README.md` describes the product, current capabilities, and entry points for humans.
- `AGENTS.md` contains short, normative instructions needed on every agent task. It
  links to deeper documentation rather than becoming a second architecture manual.
- `CLAUDE.md` contains only the minimum mechanism needed for Claude Code to consume the
  shared instructions. It must not independently restate them.
- `docs/architecture/` describes the architecture that exists now, not hoped-for future
  architecture.
- `docs/decisions/` records accepted architectural decisions and their rationale.
  Decision records are not silently rewritten when the decision changes; a new record
  supersedes the old one.
- `docs/development/` contains maintained operating procedures that must match actual
  commands and configuration.
- `plans/active/` contains proposed or in-progress work. Plans can discuss alternatives
  and unfinished designs without pretending they are current architecture.
- `plans/archive/` preserves completed and abandoned plans with a short outcome note.
- `docs/provenance.md` records clean-port lineage centrally. Individual package READMEs
  may link to it rather than each inventing provenance wording.

### Keeping decisions pertinent over time

Each active plan should end in one of three outcomes:

- Its implemented architecture is reflected in `docs/architecture/`.
- Its binding choices are captured in one or more decision records.
- The plan is archived with an outcome explaining what was completed, rejected, or
  deferred.

Decision records should include:

- Context and constraints at the time of the decision.
- The chosen option and meaningful rejected alternatives.
- Consequences and known debt.
- A concrete revisit trigger, such as a second consumer, a failed browser-bundle check,
  or measured incompatibility—not a calendar reminder without evidence.
- Links to the tests, configuration, or packages that embody the decision.

Documentation remains pertinent when it is coupled to observable reality. Prefer:

- commands copied from `package.json`, or tests that verify documented invariants;
- CI checks for broken links, generated pointer drift, or forbidden dependencies where
  the cost is justified;
- small document headers stating status and supersession;
- review of affected documentation in the acceptance criteria for architectural work.

Avoid making every document carry a frequently stale “last reviewed” date. A decision's
revisit trigger and links to enforcing code are stronger than an unverified timestamp.

The consolidation plan itself is a bootstrap/context artifact. Once prosodio is seeded,
it should be copied into `plans/active/`, progressively discharged into durable docs and
decision records, and eventually archived. It should not remain the permanent
architecture manual.

## Public repository and private corpus boundary

The public/private split should be designed during the first whisper port because both
whisper and EPUB validation need it.

Recommended model:

### Public repository

- Small redistributable fixtures with explicit provenance and licensing.
- Unit and integration tests that run without private data.
- Schemas, report generators, benchmark runners, and sanitization logic.
- Small synthetic or public golden outputs where they test stable semantics.
- Sanitized aggregate findings only when Daniel intentionally chooses to publish them.
- `.env.example` or documented configuration keys, never Daniel's absolute corpus
  paths.

### Private local data

- Raw audiobook and ebook corpora outside the Git worktree.
- Full generated reports outside the public repository.
- A local configuration file ignored by Git, or environment variables, mapping logical
  corpus names to paths.
- Optional separate private Git repository for full regression reports if historical
  diffs are important. This is preferable to committing private reports and relying on
  later scrubbing.

### Public/private regression workflow

- `bun run ci` operates exclusively on public fixtures and is the GitHub Actions gate.
- A separate explicit command, such as `bun run validate:private`, exercises configured
  private corpora.
- Private reports record the prosodio commit, schema versions, tool/dependency versions,
  logical corpus identifier, and relevant environment metadata.
- A deliberate promotion step can produce a sanitized public summary; a full private
  report must never be copied automatically into the repository.
- Sanitization tests should reject absolute paths, titles or filenames where required,
  and other known identifiers before producing anything eligible for publication.

Raw SHA-256 values of private books should also be treated as potentially identifying
corpus fingerprints. Public summaries can use run-local opaque IDs or omit per-book
identity entirely.

Performance results need a similar split. Small public benchmarks prove the runner
works; private full-corpus evaluations measure real behavior. Performance comparisons
should record hardware, model, executable version, command configuration, and corpus
identity. They should not become a hard CI gate unless the environment is controlled
enough to make the threshold meaningful.

## EPUB boundaries

The plan currently risks turning the validation harness's internal adapter boundaries
directly into production package boundaries. The following concepts should remain
distinct even if they initially share code:

- Parser observation: everything required to compare implementations faithfully,
  represented today by `ParserOutput`.
- Production ebook consumption: the stable information downstream alignment or player
  code needs from an ebook.
- Parser implementation: epubts-node today, replaceable later.
- Validation-only implementations: browser epubts and Storyteller comparison paths.
- Corpus runner and reporting: private-data orchestration and regression evidence.

Do not design the final alignment-facing ebook contract now. During the EPUB port,
define only the smallest real consumption operation required by the next consumer and
keep `ParserOutput` as the validated parity contract. The two models can share lower
level types where evidence supports it.

A likely initial shape—not yet a package decision—is:

```text
production EPUB API
  -> selected epubts-node implementation

epub validation app
  -> ParserOutput observation contract
  -> epubts-node observer
  -> epubts-browser observer
  -> Storyteller observer
  -> comparison and private reporting
```

This design provides a real way to test:

- whether consumers depend only on the production abstraction;
- whether Playwright and DOM dependencies remain validation-only;
- whether shared dependency catalogs produce one intended version;
- whether a dependency belongs in `dependencies`, `devDependencies`, or
  `peerDependencies`;
- whether dead-code/dependency tools understand workspace packages correctly.

Peer dependencies should not be adopted merely to centralize versions. They are useful
when a package must use a host-provided singleton or intentionally support a compatible
version range. Workspace catalogs and a single lockfile are generally the simpler
default for internal packages.

## Port strategy and provenance

For substantial functional sources such as whisper and EPUB validation, use two logical
phases even if practical path/configuration changes are needed immediately:

- Behavior-preserving port: copy the source, record its exact source repository SHA and
  path, make only changes needed to run in prosodio, and satisfy an explicit equivalence
  check.
- Native normalization: rename, split packages, change configuration, or adopt new
  workspace conventions in reviewable follow-up changes.

Separating these phases makes regressions attributable and compensates for not importing
Git history. `docs/provenance.md` should record at least:

```text
component
source repository
source commit
source path
source worktree state
target path
port commit
equivalence/acceptance evidence
intentional deviations
```

For whisper, “reproduce” needs a concrete acceptance contract. Candidate evidence:

- Existing unit and integration tests pass.
- A public fixture produces semantically equivalent VTT output.
- Cache behavior, runner selection, segmentation, and failure behavior remain covered.
- A representative private corpus smoke run completes through the external-data
  configuration.
- Performance is recorded for comparison but only gated where variance is controlled.

## Revised migration epochs

### Epoch 0: seed and operating contract

- Create the public repository and minimal Bun workspace.
- Establish the documentation authority/lifecycle described above.
- Establish minimal Claude Code and Codex instruction discovery without claiming a
  finished harness framework.
- Establish public fixture and private corpus conventions.
- Provide one root CI command that works before the first application arrives.
- Record provisional tooling decisions and their revisit triggers.

### Epoch 1: transcribe

- Clean-port `bun-one/apps/whisper` with provenance.
- Keep its trusted VTT implementation internal.
- Adapt corpus paths, caches, outputs, and performance evaluations to the public/private
  boundary.
- Prove the root CI target includes the application.
- Use the port to validate runtime-bound package/application conventions.

### Epoch 2: EPUB parsing and validation

- Port `epub-validate` with its current validated findings intact.
- Preserve `ParserOutput` as the parser-parity contract.
- Introduce the smallest production EPUB abstraction justified by an actual consumer.
- Keep browser and Storyteller machinery out of production dependency graphs.
- Move full-corpus reports to the private workflow and retain public deterministic
  fixtures/summaries sufficient to test the tool.
- Exercise dependency sharing, isolation, and dead-dependency checks deliberately.

### Epoch 3: audiobook collection validation

- Assess and port the useful `nx-audiobook/apps/validate`, `validators`, and required
  file-walking behavior.
- Re-evaluate the generic validation abstraction against actual EPUB-validation needs;
  do not unify the models solely because both use the word “validation.”
- Exclude the old viewer/conversion surface unless a fresh requirement justifies it.

### Epoch 4: alignment research

- Port or mine `audio-deno-match`, `chapter-marks-match`, and other references under
  Bun.
- Define evaluation corpora and metrics before selecting an algorithm.
- Develop the word-level alignment contract in a dedicated plan informed by the now
  real transcription and EPUB APIs.

Player, finder, TTS, and search remain later capability decisions rather than implied
members of the initial release.

## AI harness enablement

The plan should frame harness support as an empirical compatibility program, not a
one-time neutral configuration design.

Initial contract:

- `AGENTS.md` is the canonical repository instruction document.
- Harness-specific files are minimal adapters or pointers where the harness supports
  that mechanism.
- Durable technical knowledge remains in plain Markdown under `docs/`.
- Skills are added only for repeated workflows with evidence that a skill improves
  execution; portable workflow documentation remains available without the skill.
- MCP configuration is documented per harness because its storage and semantics are not
  currently portable.

A first acceptance check can be intentionally modest:

- In a clean session, Claude Code and Codex both discover the repository instructions.
- Both identify the same root CI command and private-data restriction.
- Both can make a small fixture-backed change and run the authoritative checks without
  requiring contradictory instructions.
- Any harness-only setup is listed in `docs/development/ai-harnesses.md` and does not
  redefine repository architecture.

This tests the behavior Daniel actually needs. More ambitious evaluation—skills,
subagents, MCP equivalence, instruction adherence scoring—can be added from observed
failures rather than predicted up front.

## Remaining questions

These questions are narrower than the original alignment questions and affect the first
two epochs:

- Should the first port preserve the `whisper` application and CLI name, or is renaming
  it to `transcribe` part of the initial behavior-preserving port?
- What parts of whisper count as its public contract: CLI flags, VTT bytes, cache layout,
  benchmark JSON, exit codes, or only semantic transcription output?
- For private report history, does Daniel prefer a separate private Git repository, or
  local unversioned reports plus selected snapshots/backups?
- Are filenames and book titles themselves private, or may sanitized aggregate reports
  include titles while excluding filesystem paths and raw content?
- Should public fixtures be limited to existing known samples, or should prosodio adopt
  a rule requiring documented license/provenance for every binary fixture?
- Which license should the public prosodio repository use?
- Is `prettier + eslint` accepted as the explicit provisional seed choice, with a revisit
  trigger, or must formatting/linting be resolved before seeding?

## Recommended immediate edits to the main plan

- Add the confirmed direction from Daniel.
- Replace the migration order with the epoch sequence above at summary level.
- Correct the VTT and EPUB-parser contradictions.
- Replace the blanket `VALIDATED` rule with separate decision and evidence states.
- Add the documentation lifecycle and public/private boundary as Epoch 0 requirements.
- Mark the tentative EPUB package tree as illustrative rather than the expected split.
- Remove stale three-axis/four-axis and all-components-decided completion text.
- Keep detailed word-level alignment design explicitly outside this plan.
- Leave this review separate until Daniel and Claude decide which recommendations to
  accept; then update the main plan rather than maintaining two competing plans.
