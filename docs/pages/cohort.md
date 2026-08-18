# Page 2 — Cohort

**Routes:**
- `/ive/cohort` — list view (`client/src/apps/ive/pages/Cohort.tsx`)
- `/ive/cohort/:cohortDefinitionId` — detail view (`client/src/apps/ive/components/CohortDetail.tsx`)

## Purpose

Browse and inspect predefined patient cohorts (PheLib-sourced phenotype definitions). The list view lets the user find a cohort; the detail view lets them drill into the cohort's members.

## List view (`/ive/cohort`)

### Layout

- **Stat cards** — total definitions, externally sourced, public, last sync timestamp.
- **Toolbar** — search box (filters by name / description / cohort ID) + Sync button.
- **Grid of cohort rows** — name, description, subject count, syntax type (e.g. JSON, SQL).
- **Pagination** — 5 / 10 / 25 / 50 per page.

### Action: click a row

Navigates to `/ive/cohort/<cohortDefinitionId>`.

### Action: Sync

Refreshes the cohort definitions from the external source. (Currently the list is loaded from a static seed of ~17 definitions; the Sync button is wired for the eventual remote-pull.)

## Detail view (`/ive/cohort/:cohortDefinitionId`)

### Layout

- **Back button** — returns to the list.
- **Left sidebar** — list of subjects in the cohort. Each button shows the person ID and the cohort start / end dates.
- **Right panel** — `CohortSubjectView` for the selected subject (person ID, cohort window).

### Notes

The current implementation reads subjects from a static `COHORT_SUBJECT_DATA` map for demo purposes. Hooking it up to a real `/api/omop/cohort_subject` endpoint is a follow-up.
