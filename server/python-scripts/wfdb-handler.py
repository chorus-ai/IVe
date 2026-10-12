import json
import sys
import datetime
import os
import wfdb
import numpy as np


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)


# args: <record_path> <offset_sec> <range_sec>
# record_path may include .hea/.dat extension; wfdb wants the base name.
record_arg = sys.argv[1]
offset_sec = float(sys.argv[2])
range_sec = float(sys.argv[3])

base, ext = os.path.splitext(record_arg)
record_name = base if ext.lower() in (".hea", ".dat") else record_arg

header = wfdb.rdheader(record_name)
fs = float(header.fs)
sig_len = int(header.sig_len)

sampfrom = max(0, int(offset_sec * fs))
sampto = min(sig_len, sampfrom + int(range_sec * fs))
if sampto <= sampfrom:
    sampto = min(sig_len, sampfrom + 1)

record = wfdb.rdrecord(record_name, sampfrom=sampfrom, sampto=sampto)

if header.base_date and header.base_time:
    start_dt = datetime.datetime.combine(header.base_date, header.base_time)
    start_dt = start_dt + datetime.timedelta(seconds=sampfrom / fs)
    start_time = start_dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3]
else:
    start_time = None

signals = record.p_signal if record.p_signal is not None else record.d_signal
n_channels = signals.shape[1] if signals is not None else 0

waveform_data = []
for i in range(n_channels):
    samples = signals[:, i]
    samples = np.where(np.isnan(samples), None, samples).tolist()
    waveform_data.append({
        "Channel": record.sig_name[i] if i < len(record.sig_name) else f"ch{i}",
        "UOM": record.units[i] if i < len(record.units) else "",
        "ID": i,
        "Samples": samples,
    })

result = {
    "StartTime": start_time,
    "OffsetInSec": offset_sec,
    "TicksPerSec": fs,
    "SamplesPerChannel": sampto - sampfrom,
    "TotalSamples": sig_len,
    "DurationSec": sig_len / fs,
    "WaveformData": waveform_data,
}

print(json.dumps(result, cls=NpEncoder))
