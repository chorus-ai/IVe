# Page 7a — Waveform Viewer

**Route:** `/ive/table/waveform`
**Also available as:** a dashboard widget (`type: 'waveform'`, category `person`) — see the [Widgets](../guides/widgets.md) guide — usable in the Workspace and on any layout-hosting page, including the Cohort → Subject view (see [Cohort](cohort.md)).

## Status

**Implemented.** A multi-channel physiological waveform viewer, launched from an OMOP table row or embedded directly in a saved dashboard layout (e.g. the built-in "Subject Event Timeline" layout).

## What it does

Renders a bedside-monitor-style stack of synchronized signal traces from a WFDB-style record:

- **Header strip** — sampling rate (`fs`), source file duration, buffered range, and the current scrubbed view window (e.g. `fs: 62.47 Hz`, `file: 4h 25m 40.5s`, `buffered: 0.0s → 60.0s (60s / 300s)`, `view: 2.9s → 20.6s`).
- **One row per channel** — each with its own y-axis/units and a mini scrub bar under the main trace for repositioning the view window. Observed channels include ECG leads **II** and **V** (mV), **aVR** (mV), **Pleth** (NU, plethysmogram), and **Resp** (Ohm, respiration) — the exact channel set depends on the underlying record.
- **Buffered vs. full-file indicator** — the scrub bar distinguishes the currently buffered/loaded portion of the recording from the full file length, so scrubbing far ahead can trigger loading more of the signal.

## Known limitation

As of the last widget-system notes, the waveform widget does not yet follow the selected subject via the `personId` override the way other `category: 'person'` widgets do — it shows whatever WFDB record is set in its own config rather than resolving a person→record mapping automatically. Confirm current behavior in the app before relying on per-subject auto-selection.

## Details not covered here

Backend endpoint(s) and Redux/app-state wiring for waveform data are not documented in the available source material — check `client/src/apps/ive/components/WaveformView.tsx` and the `waveform` entry in `widgets/registry.ts` in the monorepo for the current implementation.
