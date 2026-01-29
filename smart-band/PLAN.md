# Honor Band 6 -> Xiaomi Smart Band 10 (Pixel 9)

## Summary

- Goal: move to Band 10 without losing access to your data.
- Default architecture: Health Connect is canonical; Google Fit is a viewer/sink.
- Rule: one writer per metric type into Health Connect (avoid duplicates).

## Unresolved (must answer)

- [ ] U-001 Google Fit + Health Connect: does Google Fit write steps into Health Connect on Pixel 9?
      Answer:
- [ ] U-002 Pixel 9 default step source: what writes steps if you do nothing (phone sensors / Fit / another Google app)?
      Answer:
- [ ] U-003 Mi Fitness -> Health Connect coverage: which metrics actually land (steps/sleep/HR/workouts) on Pixel 9?
      Answer:
- [ ] U-004 Fallback rule: if Mi Fitness misses a metric, what is the chosen fallback that preserves "one writer per metric"?
      Answer:

## Plan of record

Defaults (until proven otherwise)

- Health Connect is canonical.
- Google Fit is a sink/viewer only.
- Mi Fitness is the primary collector for Band 10.

Definition of done

- [ ] You have an offline archive you own (Apple Health export ZIP and/or Huawei Privacy Centre ZIP).
- [ ] Band 10 -> Mi Fitness -> Health Connect works for the metrics you care about.
- [ ] No obvious duplicates for steps/sleep/workouts/HR after 1-2 days.

## Execution checklist

1. Offline escape hatch (iPad + web)

- [ ] iPad Health app: Export All Health Data; confirm you can access the ZIP.
- [ ] Huawei ID Privacy Centre: Request Your Data; confirm you can download and store the ZIP.
- [ ] Record where you stored the ZIP(s) (folder/drive/path).

2. Decide legacy history import (optional)

- [ ] Decide whether you want legacy Huawei history inside Health Connect.
- [ ] If yes: install Huawei Health on Pixel 9; sign in; confirm history appears.
- [ ] If yes: install Health Sync; confirm Huawei Health is available as a source.
- [ ] If yes: note whether Health Sync historical sync requires a one-time unlock.

3. Band 10 onboarding (Pixel 9)

- [ ] Pair Band 10 with Mi Fitness.
- [ ] Grant Mi Fitness write permissions in Health Connect.
- [ ] After 24-48h: confirm metrics land in Health Connect (steps/sleep/HR/workouts).

4. De-dup (Pixel 9)

- [ ] For each metric type, confirm exactly one writer into Health Connect.
- [ ] Configure Google Fit to read from Health Connect (viewer/sink), not as a parallel writer.
- [ ] If Google Fit is enabled, avoid parallel writes to Fit when Fit is also reading from Health Connect.

## References

- Background, glossary, dataflows: `smart-band/RESEARCH.md`

## Decision record (fill in)

- Date:
- Legacy history inside Health Connect: yes/no (why)
- Future writer into Health Connect: Mi Fitness / Health Sync / other
- Google Fit mode: read from Health Connect only / other
- Notes:
