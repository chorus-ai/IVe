# 7a. Waveform Viewer

Also usable as a dashboard widget in the Workspace or on the Cohort → Subject view — see the [Widgets](widgets.md) guide and the [Cohort](cohort.md) page.

## Status

**Implemented.** A multi-channel physiological waveform viewer, launched from an OMOP table row or embedded directly in a saved dashboard layout (e.g. the built-in "Subject Event Timeline" layout).

![Multi-channel waveform viewer showing ECG leads II/V/aVR, Pleth, and Resp for a subject](../.gitbook/assets/subject_event_timeline_waveform.png)

## What it does

Renders a bedside-monitor-style stack of synchronized signal traces from a WFDB-style record:

* **Header strip** — sampling rate (`fs`), source file duration, buffered range, and the current scrubbed view window (e.g. `fs: 62.47 Hz`, `file: 4h 25m 40.5s`, `buffered: 0.0s → 60.0s (60s / 300s)`, `view: 2.9s → 20.6s`).
* **One row per channel** — each with its own y-axis/units and a mini scrub bar under the main trace for repositioning the view window. Observed channels include ECG leads **II** and **V** (mV), **aVR** (mV), **Pleth** (NU, plethysmogram), and **Resp** (Ohm, respiration) — the exact channel set depends on the underlying record.
* **Buffered vs. full-file indicator** — the scrub bar distinguishes the currently buffered/loaded portion of the recording from the full file length, so scrubbing far ahead can trigger loading more of the signal.

## Known limitation

As of the last widget-system notes, the waveform widget does not yet follow the selected subject the way other person-scoped widgets do — it shows whatever record is set in its own config rather than resolving a per-subject mapping automatically. Confirm current behavior in the app before relying on per-subject auto-selection.
