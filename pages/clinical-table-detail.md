# Page 7 — Clinical Table Detail

**Route:** `/ive/table/:tableKey`
**Source:** `client/src/apps/ive/components/ClinicalTablesDetail.tsx`
**Specialised variants:**
- `WaveformView` (`tableKey=waveform`) — multi-channel waveform viewer (see [Waveform Viewer](waveform.md)).
- `ImagingView` (`tableKey=dicom`) — **Coming soon** preview (see [DICOM Viewer](dicom.md)).

## Purpose

The workhorse view: a paginated, filterable, sortable grid over any OMOP table. Users compose filters, save them as endpoints, and drill from any row into a Person or Visit view.

## What the user sees

- **Header** — table display name + row count.
- **Toolbar:**
  - Concept-search input — type a term, get matching `*_concept_id` rows, multi-select chips, applied as `IN (...)` filter.
  - **Columns** menu — show / hide individual columns (`ColumnsMenu`).
  - **Filter** button — opens `FilterModal` (see Filter section below).
  - **Save Filter** — appears only when the current filter set is not already a saved endpoint.
- **Filter chips row** (`FilterChips`) — shows the currently applied filter rules; click ✕ on a chip to drop that rule.
- **DataGrid** — server-side paginated, sticky header, sortable columns. `person_id` and `visit_occurrence_id` cells are links to the Person / Visit views.

## Filter modal (`FilterModal`)

Centered modal with a list of rules combined by AND. Each rule is `Where <column> <operator> <value>`. Add and Remove per row, Apply / Clear all in the footer.

| Column type detected | Operators offered |
| --- | --- |
| `*_concept_id` | `is one of` (multi-select via concept search) |
| `*_id` (non-concept) | `is one of` (comma / space separated) |
| date / datetime | between, greater than, less than, equals |
| numeric | between, greater than, less than, equals |
| `*_source_value` | equals, contains, starts with, ends with |
| free text | contains, starts with, ends with, equals |

Two rules on the same column with `>` and `<` are auto-merged into `between` on Apply.

## Backend calls

| When | Endpoint |
| --- | --- |
| Page mount / paginate / sort | `POST /api/omop/<table>/search` (body: filters, page, pageSize, sort) |
| Row count | `GET /api/omop/<table>/count` |
| Concept search in filter | `GET /api/vocab/concept` (autocomplete) |
| Save Filter | `POST /api/ive/endpoints` |

## Redux state

Per-table slice under `ive.tables[<tableKey>]`:
- `filters`, `page`, `pageSize`, `sortBy`, `sortOrder`.

So a user can navigate away and come back to the same view.

## Linked views

- Person link → [`/ive/person/:personId`](person.md).
- Visit link → [`/ive/visit/:visitId`](visit.md).
- Save Filter → [Endpoints](endpoints.md) page shows the saved row.

## Specialised modes

- **Waveform** (`/ive/table/waveform`) — multi-channel ECG / plethysmogram / respiration viewer over a WFDB-style record, with a scrubbable time window (see [Waveform Viewer](waveform.md)).
- **DICOM** (`/ive/table/dicom`) — radiology viewer with WL/WW, measurements, annotations, and OMOP linkage. Currently shows a coming-soon preview (see [DICOM Viewer](dicom.md)).
