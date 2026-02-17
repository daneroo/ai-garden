# HONOR Band 6 Huawei Export

## Huwawei Download Failure - 2026-02-17

- After seven days we got a succinct email: Try again. Ouch
  - Failure
    [GMail](https://mail.google.com/mail/u/0/#inbox/FMfcgzQfBsmNQpVfkZKChJFrRnnXBFFC)
- New request - 2026-02-17 -
  [GMail](https://mail.google.com/mail/u/0/#inbox/FMfcgzQfBsmNQstrqwkqddkNvmnmcvjz)
  - I used a distinct Password to encrypt the data this time (in 1Password)

## Quick Task List

- [x] Requested `ALL` data from Huawei Privacy Centre after successful login
      (`2026-02-10`).
- [x] Confirmed delivery method: data package will be sent by email.
- [x] Received Huawei confirmation: request timestamp `2026-02-10 14:29:54`.
  - [x] [GMAIL](https://mail.google.com/mail/u/0/#inbox/FMfcgzQfBkPmLsxVpXXCKNVKSmRjSVzg)
- [ ] Check request status at `https://privacy.consumer.huawei.com/tool` until
      ready.
- [ ] Expect readiness notification by `2026-02-17` (Huawei said process should
      take no more than `7 days`).
- [ ] When ready, complete download within the `21-day` availability window.
- [ ] Archive downloaded package to local path and backup copy.
- [ ] Run iPad Apple Health export fallback and store zip.

## Latest Request Confirmation

- Huawei ID (masked): `danie********@***il.com`
- Request submitted at: `2026-02-10 14:29:54`
- Huawei SLA note: "process shouldn't take more than 7 days"
- Status page: `https://privacy.consumer.huawei.com/tool`

## Context

- You are migrating from `Honor Band 6` to a new tracker setup.
- Your historical data currently lives in `Huawei Health` connected to an
  `iPad`.
- Region: `Canada`.
- You need a durable export now, independent of the migration path you choose
  later.
- Priority: perform an export path that can be initiated from a computer, with
  official vendor guidance.

## Goal

- Produce and securely store at least one export of your Huawei-linked data
  using a computer workflow.
- Keep a second offline fallback copy from Apple Health on iPad.
- End with files you control locally (zip/files), plus notes on what was
  exported and when.

## Authoritative Computer Export Path (Huawei)

As of `2026-02-10`, Huawei Support Canada indicates this flow:

1. On your computer, sign in to your Huawei account and open `Privacy Centre`.
2. Use `Request Your Data`.
3. Complete identity verification.
4. Wait for Huawei to prepare the data package.
5. Download when ready (Huawei states the prepared package is available for
   `21 days`).

Huawei also states:

- Function availability varies by country/region.
- Some data (such as cloud-stored content) may need separate download from
  `cloud.huawei.com`.
- Exports are provided in original or common formats (for example `.json`,
  `.csv`, `.pdf`, `.vcf`, `.ics`, `.html`).

## Exact Steps (Computer First)

1. Confirm your Huawei ID credentials used on the iPad Huawei Health app.
2. Open Huawei support guidance page for data copy requests:
   `https://consumer.huawei.com/ca/support/content/en-us00746223/`
3. From that flow, go to `Privacy Centre > Request Your Data` and submit a
   request.
4. If needed, open the Huawei privacy request tool directly:
   `https://privacy.consumer.huawei.com/tool`
5. Select all relevant categories available for export.
6. Complete account verification prompts.
7. Track completion status and download the package immediately once ready
   (`21-day` availability window).
8. Save the package to a durable path, for example:
   `~/Documents/health-exports/huawei/2026-02-10/`
9. Record metadata in a notes file:
   - request date/time
   - Huawei ID used
   - delivery method (email/portal)
   - archive filename and size
   - whether health records you expected are present

## Parallel Fallback (Optional iPad Local Export)

Do this even if the Huawei computer export succeeds.

1. On iPad: `Health` app.
2. `Summary` -> profile icon.
3. `Export All Health Data`.
4. Save the XML export zip to your controlled storage.

## Sources (Official)

- Huawei Support Canada: Obtain copy of your data linked to your HUAWEI ID
  account\
  `https://consumer.huawei.com/ca/support/content/en-us00746223/`
- Huawei Canada: Manage Your Privacy\
  `https://consumer.huawei.com/ca/privacy/manage/`
- Huawei Privacy Questions portal (country selectable)\
  `https://consumer.huawei.com/en/legal/privacy-questions/`
- Huawei Privacy Centre tool\
  `https://privacy.consumer.huawei.com/tool`
- Apple Support: Share your health and fitness data in XML format (iPad)\
  `https://support.apple.com/guide/ipad/share-your-health-data-ipade9e6b160/ipados`
