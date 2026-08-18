---
description: >-
  Single-encounter summary. Shows what happened during one visit —
  admission/discharge info, the clinical note, and the rows the visit
  produced in the main OMOP domain tables.
---

# Visit Data View

## What the user sees

A fixed widget layout (no auto-discovery, unlike the [Person](person.md) view):

1. **`visit_header`** (`VisitHeaderWidget`) — visit type, start / end datetime, admitting source, discharge disposition, length of stay.
2. **`clinical_note`** — notes attached to this visit.
3. **`conditions`** — `condition_occurrence` rows linked to this visit.
4. **`medications`** — `drug_exposure` rows.
5. **`measurements`** — `measurement` rows, rendered via `OmopDomainTableWidget` with the `measurement` domain.

## Widget data calls

Each widget queries its own table scoped to the visit:

```
POST /api/omop/<table>/search { where: { visit_occurrence_id: <visitId> }, ... }
```

## Why fixed (vs Person's auto-discovery)

A visit is a tighter unit — the relevant tables are predictable, so we hard-code the layout for snappier mount times. Person, by contrast, may have decades of records across any subset of OMOP tables, so dynamic discovery pays off there.

## Related

- Reached from any `visit_occurrence_id` link in the [Clinical Tables](clinical-tables.md) detail view or [Person](person.md) view.
