# EPUB Validate Report

- Run manifest schema: 1
- Runner: epub-inspect 0.1.0
- Bun: 1.3.14
- Chromium: 149.0.7827.55
- epub.ts: 0.6.7
- Storyteller: 0.6.2
- Playwright: 1.61.0
- Occurrences: 1304
- Distinct content: 756

## Corpora discovery

deduped = sha256 already seen earlier in scan order (test, space, drop).

| root | found | deduped | distinct |
|---|---:|---:|---:|
| test | 4 | 0 | 4 |
| space | 590 | 7 | 583 |
| drop | 710 | 541 | 169 |
| total | 1304 | 548 | 756 |

## Parser open outcomes

Distinct-content denominator: 756.

| parser | opened | open-failed | epub2-unsupported | jsdom fallback |
|---|---:|---:|---:|---:|
| epubts-browser | 756 | 0 | 0 | 0 |
| epubts-node | 756 | 0 | 0 | 9 |
| storyteller | 213 | 18 | 525 | 0 |

## Open failures

Genuine open failures only; epub2-unsupported is expected and excluded.

### space

- Alastair Reynolds - Revelation Space/Alastair Reynolds - Revelation Space 01 - Revelation Space/Alastair Reynolds - Revelation Space 01 - Revelation Space.epub — storyteller (Error)
- Alastair Reynolds - Revelation Space/Alastair Reynolds - Revelation Space 03 - Redemption Ark/Alastair Reynolds - Revelation Space 03 - Redemption Ark.epub — storyteller (Error)
- Alastair Reynolds - Revelation Space/Alastair Reynolds - Revelation Space 06 - Diamond Dogs Turquoise Days/Alastair Reynolds - Revelation Space 06 - Diamond Dogs Turquoise Days.epub — storyteller (Error)
- Brent Weeks - The LightBringer Saga/Brent Weeks - The Lightbringer Saga 02 - The Blinding Knife/Brent Weeks - The Lightbringer Saga 02 - The Blinding Knife.epub — storyteller (Error)
- Brent Weeks - The LightBringer Saga/Brent Weeks - The Lightbringer Saga 03 - The Broken Eye/Brent Weeks - The Lightbringer Saga 03 - The Broken Eye.epub — storyteller (Error)
- Craig Alanson - Expeditionary Force/Craig Alanson - Expeditionary Force 06 - Mavericks/Craig Alanson - Expeditionary Force 06 - Mavericks.epub — storyteller (Error)
- Glen Cook - Black Company/Glen Cook - Black Company 03 - The White Rose/Glen Cook - Black Company 03 - The White Rose.epub — storyteller (Error)
- Madeline Miller - Circe/Madeline Miller - Circe.epub — storyteller (Error)
- Maurice Druon - The Accursed Kings/Maurice Druon - The Accursed Kings 01 - The Iron King/Maurice Druon - The Accursed Kings 01 - The Iron King.epub — storyteller (Error)
- Maurice Druon - The Accursed Kings/Maurice Druon - The Accursed Kings 02 - The Strangled Queen/Maurice Druon - The Accursed Kings 02 - The Strangled Queen.epub — storyteller (Error)
- Maurice Druon - The Accursed Kings/Maurice Druon - The Accursed Kings 03 - The Poisoned Crown/Maurice Druon - The Accursed Kings 03 - The Poisoned Crown.epub — storyteller (Error)
- Maurice Druon - The Accursed Kings/Maurice Druon - The Accursed Kings 04 - The Royal Succession/Maurice Druon - The Accursed Kings 04 - The Royal Succession.epub — storyteller (Error)
- Maurice Druon - The Accursed Kings/Maurice Druon - The Accursed Kings 05 - The She-Wolf/Maurice Druon - The Accursed Kings 05 - The She Wolf.epub — storyteller (Error)
- Maurice Druon - The Accursed Kings/Maurice Druon - The Accursed Kings 06 - The Lily and the Lion/Maurice Druon - The Accursed Kings 06 - The Lily and the Lion.epub — storyteller (Error)
- Maurice Druon - The Accursed Kings/Maurice Druon - The Accursed Kings 07 - The King Without a Kingdom/Maurice Druon - The Accursed Kings 07 - The King Without a Kingdom.epub — storyteller (Error)
- Ramez Naam - Nexus/Ramez Naam - Nexus 01 - Nexus/Ramez Naam - Nexus 01 - Nexus.epub — storyteller (Error)
- Terry Pratchett - Discworld/Terry Pratchett - Discworld 05 - Sourcery/Terry Pratchett - Discworld 05 - Sourcery.epub — storyteller (Error)
- Terry Pratchett - Discworld/Terry Pratchett - Discworld 34 - Thud!/Terry Pratchett - Discworld 34 - Thud!.epub — storyteller (Error)

## Comparison pairs

- [epubts-node vs epubts-browser](epubts-node--epubts-browser.md)
- [epubts-node vs storyteller](epubts-node--storyteller.md)
