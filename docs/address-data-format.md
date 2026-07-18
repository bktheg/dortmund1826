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

Every `by-name/*.json` and `by-gewerbe-type/<slug>.json` entry also carries the
building geometry link (`bi`/`bc`, see below) so the map can select the actual
buildings for an entry without a spatial query.

## Common conventions

- **`q`** — source string, e.g. `"Adressbuch Dortmund 1914"`.
- **Address fields** appear together on most entries:
  - `s` = street (raw), `h` = house number (raw) — for display.
  - `cs` = clean/normalized street, `ch` = clean/normalized house number — for
    matching against map/tile data (same normalization the tiles use).
- **Building link** (every `by-name/*.json` and `by-gewerbe-type/<slug>.json`
  entry — but never in `by-street`):
  - `bi` = building ids (`ogc_fid`) of every building whose address matches this
    entry, resolved with the **same 3-tier logic as the `gebaeudef` tile layer**
    (so the set equals what the map shows). Sorted, deduplicated. These are the
    MVT **feature ids** on the `gebaeude`/`gebaeudef` tile layers — i.e. an id in
    `bi` matches `feature.getId()` in OpenLayers, so you can select/highlight the
    building features directly.
  - `bc` = `[lon, lat]` (WGS84) — the center to pan to / place a marker on. It is
    the mean centroid of the entry's **main** buildings only: Nebengebäude
    (`gebaeude.nebengeb` set and non-zero — sheds, back buildings) are ignored,
    because averaging them in drags the marker into the backyard. If an address
    matches *nothing but* Nebengebäude, they are all we have, so `bc` falls back
    to the mean over all matched buildings. Either way `bi` still lists **every**
    matched building, Nebengebäude included — so `bc` is not necessarily the
    center of the buildings in `bi`.
  - Both keys are **omitted when no building matches** — see the warning below.
- **Street coordinate** (`by-street` files only): `c` = `[lon, lat]` (WGS84) — a
  point on the street itself, namely the midpoint of the longest linestring of
  its geometry. Use to pan to a street. **Omitted** when the street has no
  matching geometry (roughly half of the address-book streets: geometries only
  exist inside the surveyed `alk2_grenzen` area).
- Both coordinate fields — `bc`, and the top-level `c` of a `by-street` file — are
  WGS84 `[lon, lat]` rounded to 6 decimals. (Careful: the key `c` means something
  else elsewhere in this format — a clean house number inside `g[]`, a category on
  a Behörde entry, an entry count in the `by-name`/`by-gewerbe-type` indexes. Only
  the **top level of a `by-street` file and its `_index` entry** is a coordinate.)
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
  "c": [7.457269, 51.513639],       // [lon, lat] of the street (omitted if no geometry)
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
{ "q": "...", "e": [
  { "s": "Musterstraße", "f": "musterstrasse.json", "c": [7.457269, 51.513639] }
] }
```

`s` = street name, `f` = filename in this folder, `c` = `[lon, lat]` of the
street (same value as in the street file; omitted when the street has no
geometry). Sorted by `s`. `c` lets you pan to a street straight from the index,
without fetching its file.

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

`bi` = matching building ids (`ogc_fid`), `bc` = `[lon, lat]` center of the
matching **main** buildings (Nebengebäude ignored unless nothing else matches).
Both absent when no building matches.

### `by-name/behoerden.json`

One entry per record.

```jsonc
{ "q": "...", "e": [
  { "n": "Name", "z": "Detail", "k": "Kategorie", "u": "Unterkategorie",
    "f": "", "s": "...", "h": "...", "cs": "...", "ch": "...",
    "bi": [8, 7855], "bc": [7.457269, 51.513639] }  // building link (omitted if none)
] }
```

`bi` = matching building ids (`ogc_fid`), `bc` = `[lon, lat]` center of the
matching **main** buildings (Nebengebäude ignored unless nothing else matches).
Both absent when no building matches.

### `by-name/owners.json`

One entry per house number with an owner (largest file).

```jsonc
{ "q": "...", "e": [
  { "n": "Schulz", "j": "Kaufmann", "t": "E",
    "s": "Musterstraße", "h": "1", "cs": "musterstrasse", "ch": "1",
    "bi": [8, 7855], "bc": [7.457269, 51.513639] }  // building link (omitted if none)
] }
```

`n` = owner, `j` = occupation, `t` = owner type (`E` / `E*`).
`bi` = matching building ids (`ogc_fid`), `bc` = `[lon, lat]` center of the
matching **main** buildings (Nebengebäude ignored unless nothing else matches).
Both absent when no building matches.

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

`bi` = matching building ids (`ogc_fid`), `bc` = `[lon, lat]` center of the
matching **main** buildings (Nebengebäude ignored unless nothing else matches).
Both omitted when no building matches.

### `by-gewerbe-type/_index.json`

Drives a type dropdown/legend.

```jsonc
{ "q": "...", "e": [
  { "slug": "baecker", "t": ["Bäcker"], "c": 42 }   // c = entry count
] }
```

`slug` is the filename (without `.json`), `t` the human-readable label(s),
`c` the number of entries.
