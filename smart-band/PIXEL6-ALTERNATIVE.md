# Pixel 6 Alternative

I just took my wiped Pixel 6 out of storage.

I was wondering if that would open up a new scenario.

- Given that I don;t want to install Huwawei App Store on my Pixel 9, I could do
  so on the Pixel 6
- The install Huwawei Health
- Then pair the existing Honor Band 6 to the Pixel 6
- Then connect to Health Sync (appyhapps)
- Then push that to Health Connect from the Pixel 6

Would this make for a good transition scenario?

---

Key Learning: Health COnnect is local to a single device

Option A (recommended): Pixel 6 uses Huawei -> Google Fit as a temporary cloud
bridge; Pixel 9 pulls into Health Connect

- Pixel 6: Huawei Health -> Health Sync -> Google Fit (cloud)
- Pixel 9: Health Sync (source Google Fit) -> Health Connect (destination)

Why this is good:

- Pixel 9 never installs Huawei anything.
- Pixel 9 ends up with the data in Health Connect (your preferred canonical
  store).
- Google Fit is used only as a temporary transit layer (even though Fit is
  “legacy”, this is exactly the kind of short-term bridge it’s still good for).

Main risks:

- Duplicate loops if, later, multiple apps write steps/workouts into Fit and/or
  Health Connect. This is solvable by being strict: “one writer per metric type”
  while migrating.

## Summary of 2026-01-30 Session

Key clarifications / learnings

- Health Connect is a local, on-device datastore. It does not solve cross-phone
  migration by itself.
- Therefore, “Pixel 6 -> Health Connect” is not useful unless you add a
  cross-device transfer mechanism (cloud relay or explicit export/import).
- Google Takeout is not acceptable as the *only* off-ramp if the requirement is
  “non-manual, scriptable, idempotent, failure-notified automation”. Takeout’s
  “export every 2 months for 1 year” schedule is not a durable automation API.
- “Raw-enough” is the right framing for completeness:
  - Steps: likely already strong/complete in Google Fit historically; you can
    audit for gaps/overlaps later via export/analysis.
  - Sleep + HR: want the best raw-enough samples/segments (do not trust opaque
    aggregation).
  - SpO2: prefer not to lose, but trust is lower; still want preservation if
    possible.
- “No pager” means: you *do* want independence; you are willing to run your own
  infra; it can be down for a week without panic (gaps are acceptable), but you
  want an autonomous pipeline with alerting.

Pixel 6 staging scenario (updated understanding)

- Pixel 6 is a good “dirty importer” device, but only if it pushes into
  something cross-device (or into your own backend), not Health Connect alone.
- Practical bridge pattern (when using Pixel 6):
  - Pixel 6: Huawei Health (+ any Huawei dependencies) -> Health Sync -> Google
    Fit (cloud relay)
  - Pixel 9: Health Sync (source Google Fit) -> (destination) Health Connect or
    your own store
- Main risk remains duplication loops if multiple writers are enabled. Mitigation
  remains “one writer per metric type” during migration.

Home Assistant / independence direction

- Since you already run reliable always-on infra, this can be treated as an
  integration pipeline rather than a search for a perfect cloud truth store.
- Discovery: Home Assistant Android Companion app already has Health Connect
  sensor support and it is actively being expanded (steps, heart rate, resting
  heart rate, oxygen saturation, sleep duration, etc.).
- This suggests a potential path where:
  - Health Connect data is read on the phone by HA Companion,
  - HA stores/graphs it (optionally into your preferred time-series DB),
  - HA automations provide failure detection/notifications.
- Caveat to validate: whether HA Health Connect sensors provide “raw-enough”
  fidelity for sleep/HR (frequency, series vs summary), not just single-value
  snapshots.

Documentation/plan structure improvements completed (repo)

- Smart band work was reorganized to reduce sprawl and make execution clearer:
  - `smart-band/PLAN.md` is the concise plan of record.
  - `smart-band/RESEARCH.md` holds background, glossary, and Mermaid graphs.
- Mermaid graphs render on GitHub and were added to document the unified
  data/decision flow and the combined dataflow.
- Markdownlint issues were addressed (no ordered list numbering inside the plan
  checklist).

Open items (no decisions made yet)

- Decide canonical store strategy under the “no manual exports” constraint:
  - If “Google Fit as canonical truth”: requires a separate automatable export
    path (not Takeout).
  - If “own infra as canonical truth”: define the bridge from phone/Health
    Connect/vendor app into HA/DB and validate raw-enough fidelity.
- Validate whether HA Companion Health Connect sensors meet “raw-enough” needs
  for sleep + HR, and whether SpO2 is captured and persisted as desired.
