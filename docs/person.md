---
description: >-
  Single-patient longitudinal record. The page auto-discovers which OMOP
  tables actually have rows for this person and surfaces a widget per
  non-empty table — so the user sees a tailored view, not 23 empty cards.
---

# Person Data View

## What the user sees

- **Header** — person ID + back link.
- **Base widgets** (always present):
  - `patient_profile` — demographics card (DOB, gender, race, ethnicity).
  - `stats` — counts (visits, conditions, drugs, measurements, etc.).
  - `clinical_note` — most recent notes.
- **Dynamic OMOP widgets** — one `table_card` widget per OMOP table that has at least one row for this person (conditions, measurements, drug exposures, procedures, observations, etc.). Each widget is configured with `personId` so it scopes its query.

## Discovery logic

On mount, for each card in `OMOP_TABLES`:

```
GET /api/omop/<table>/count?where[person_id]=<personId>
```

If count > 0, render the corresponding widget. Counts are cached in `ive.tableCounts` so revisiting is instant.

## Widget data calls

Each `table_card` widget fetches its own data on mount:

```
POST /api/omop/<table>/search { where: { person_id: <id> }, ... }
```

## Related

- Embeds `Widget` (the generic widget renderer used by [Workspace](workspace.md)). See the [Widgets](widgets.md) guide.
- Links inside widgets navigate to the [Visit Data View](visit.md) when a visit ID is clicked.
