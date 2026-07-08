# Address book data format (map frontend)

Static JSON produced by the management action **Export Address Book**
(`POST /domap/genmap/exportAddressBook/{jahr}`) and uploaded to the S3 bucket.
Everything is pre-baked — the map app has no backend; it fetches these files
directly. All files are minified JSON (no indentation).

## Folder layout

Per year (`{jahr}`, e.g. `1914`):

```
{jahr}/
  by-street/            one file per street  +  _index.json
    <cleanstreet>.json
    _index.json
  by-name/              searchable name lists +  _index.json
    gewerbe.json
    behoerden.json
    owners.json
    _index.json
  by-gewerbe-type/      one file per gewerbe type + _index.json
    <slug>.json
    _index.json
```

- **`by-street/`** — full detail for one street: owners per house number, plus
  the gewerbe and behörden at each number. Use to show a building's data.
- **`by-name/`** — flat lists to search names client-side (cache in a Pinia
  store; load once). Three sources: businesses, authorities, property owners.
- **`by-gewerbe-type/`** — one file per business type; each holds every entry of
  that type with its address. Use to highlight all buildings of a type on the map.

`by-gewerbe-type/<slug>.json` and `by-name/gewerbe.json` entries also carry the
building geometry link (`bi`/`bc`, see below) so the map can select the actual
buildings for an entry without a spatial query.

## Common conventions

- **`q`** — source string, e.g. `"Adressbuch Dortmund 1914"`.
- **Address fields** appear together on most entries:
  - `s` = street (raw), `h` = house number (raw) — for display.
  - `cs` = clean/normalized street, `ch` = clean/normalized house number — for
    matching against map/tile data (same normalization the tiles use).
- **Building link** (`by-gewerbe-type/<slug>.json` and `by-name/gewerbe.json`
  entries only):
  - `bi` = building ids (`ogc_fid`) of every building whose address matches this
    entry, resolved with the **same 3-tier logic as the `gebaeudef` tile layer**
    (so the set equals what the map shows). Sorted, deduplicated.
  - `bc` = `[lon, lat]` (WGS84) — the combined center of those buildings (mean of
    their centroids). Use to pan/place a marker for the entry.
  - Both keys are **omitted when no building matches** — see the warning below.
- **`e`** — the array of entries (in `by-name` and `_index` files).
- Filenames in `by-street` and slugs in `by-gewerbe-type` are ASCII-safe
  (umlauts expanded: `ä→ae`, `ö→oe`, `ü→ue`, `ß→ss`; other chars → `-`).
- Every `_index.json` lets you enumerate available files without guessing names.

> ⚠️ **`by-street` files only** omit empty/falsy fields to save space (a missing
> key means "empty"). `by-name` and `by-gewerbe-type` files keep all keys
> (values may be empty strings) — **except** `bi`/`bc`, which are dropped
> entirely when an entry has no matching building (absence = "no buildings").

## Schemas

### `by-street/<cleanstreet>.json`

```jsonc
{
  "s": "Musterstraße",              // street name
  "q": "Adressbuch Dortmund 1914",
  "g": [                            // buildings (Gebäude), one per house number
    {
      "c": "1",                     // clean house number
      "h": "1",                     // house number (raw)
      "o": "Schulz",                // owner (Besitzer)
      "j": "Kaufmann",              // owner's occupation
      "t": "E",                     // owner type: E = resident, E* = non-resident
      "g": [                        // Gewerbe (businesses) at this number
        { "b": ["Bäcker"], "n": "Meier", "z": "", "a": "", "f": "" }
      ],
      "b": [                        // Behörden (authorities) at this number
        { "c": "Kategorie", "u": "Unterkategorie", "n": "Name", "z": "", "f": "" }
      ]
    }
  ]
}
```

Gewerbe entry: `b`=branchen (types, array), `n`=name/firm, `z`=name suffix,
`a`=address note, `f`=phone.
Behörde entry: `c`=category, `u`=subcategory, `n`=name, `z`=detail, `f`=phone.

### `by-street/_index.json`

```jsonc
{ "q": "...", "e": [ { "s": "Musterstraße", "f": "musterstrasse.json" } ] }
```

`s` = street name, `f` = filename in this folder. Sorted by `s`.

### `by-name/gewerbe.json`

One entry per firm+address (duplicates merged, all `b` types collected).

```jsonc
{ "q": "...", "e": [
  { "n": "Meier", "z": "", "b": ["Bäcker","Konditor"],
    "a": "", "f": "",
    "s": "Musterstraße", "h": "1", "cs": "musterstrasse", "ch": "1",
    "bi": [8, 7855], "bc": [7.457269, 51.513639] }  // building link (omitted if none)
] }
```

`bi` = matching building ids (`ogc_fid`), `bc` = `[lon, lat]` combined center.
Both absent when no building matches.

### `by-name/behoerden.json`

One entry per record.

```jsonc
{ "q": "...", "e": [
  { "n": "Name", "z": "Detail", "k": "Kategorie", "u": "Unterkategorie",
    "f": "", "s": "...", "h": "...", "cs": "...", "ch": "..." }
] }
```

### `by-name/owners.json`

One entry per house number with an owner (largest file).

```jsonc
{ "q": "...", "e": [
  { "n": "Schulz", "j": "Kaufmann", "t": "E",
    "s": "Musterstraße", "h": "1", "cs": "musterstrasse", "ch": "1" }
] }
```

`n` = owner, `j` = occupation, `t` = owner type (`E` / `E*`).

### `by-name/_index.json`

```jsonc
{ "q": "...", "e": [
  { "f": "gewerbe.json",   "c": 1234 },   // c = entry count
  { "f": "behoerden.json", "c": 89 },
  { "f": "owners.json",    "c": 20567 }
] }
```

### `by-gewerbe-type/<slug>.json`

All gewerbe of one type. Entries with an empty type are excluded here (they
still appear in `by-name/gewerbe.json`).

```jsonc
{
  "t": ["Bäcker"],                 // source label(s); >1 if labels share a slug
  "q": "...",
  "e": [
    { "n": "Meier", "z": "", "a": "", "f": "",
      "s": "Musterstraße", "h": "1", "cs": "musterstrasse", "ch": "1",
      "bi": [8, 7855], "bc": [7.457269, 51.513639] }  // building link (omitted if none)
  ]
}
```

`bi` = matching building ids (`ogc_fid`), `bc` = `[lon, lat]` combined center
(mean of the buildings' centroids). Both omitted when no building matches.

### `by-gewerbe-type/_index.json`

Drives a type dropdown/legend.

```jsonc
{ "q": "...", "e": [
  { "slug": "baecker", "t": ["Bäcker"], "c": 42 }   // c = entry count
] }
```

`slug` is the filename (without `.json`), `t` the human-readable label(s),
`c` the number of entries.
