import numpy as np
import math


def handle_csv(file_path, model_freq, model_signal_time):
    # data = np.loadtxt(file_path, delimiter=',', skiprows=1)
    data = np.genfromtxt(file_path, delimiter=',', max_rows=1, dtype=float)
    header = data[0]
    data = data[1:]
    # check the frequency
    # data must be stored with a header indicating the frequency of signals
    if (header != model_freq):
        raise ValueError("Incorrect frequency")

    dp = model_freq * model_signal_time

    if data.shape[0] > dp:
        num_intervals = math.ceil(data.shape[0] / dp)
        intervals = np.empty((num_intervals, dp), dtype=float)
        for i in range(num_intervals):
            start = i * dp
            end = start + dp
            interval = data[start:end]

            if i == num_intervals - 1 and len(interval) < dp:
                interval = data[-dp:]

            np.append(intervals, np.array([interval]), axis=0)
    else:
        intervals = np.array([data])
    
    return intervals