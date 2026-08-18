# Page 7b — DICOM Viewer (Coming Soon)

**Route:** `/ive/table/dicom`
**Source:** `client/src/apps/ive/pages/Imaging.tsx`

## Status

**Coming soon.** The current page renders a polished "coming soon" landing — header, faux-radiology preview panel labelled MOCK DATA, planned-capability list, and CTAs back to the table directory. No PACS layer is wired up yet.

## What it will be

A radiology viewer that opens the underlying study from any procedure or imaging-event row. The user sees window/level controls, measurements, and annotations alongside the rest of the patient view — no separate desktop viewer round-trip.

## Planned capabilities

- **Stack & series navigation.** Scroll through DICOM series with thumbnails and keyboard shortcuts.
- **Window / level + presets.** Bone, lung, soft-tissue, brain presets plus free WL/WW adjustment.
- **Annotations & measurements.** Length, angle, ROI, and freeform notes saved per study.
- **Linked to OMOP.** Open the study directly from a procedure or imaging-event row.

## Current page elements

- Header strip — title + "Coming soon" badge.
- Pitch paragraph — what the feature will deliver.
- Preview panel — decorative radiology icon with faked study overlays (clearly labelled MOCK DATA).
- Capability grid — four planned-feature cards.
- CTAs — "Back to tables" and "Explore other views".

## What's not in the page

- No backend calls (PACS integration is the next milestone).
- No Redux state.
- No real DICOM rendering pipeline. The viewer will likely use Cornerstone.js or OHIF when implemented.
