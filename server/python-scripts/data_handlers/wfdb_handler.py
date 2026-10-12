import os
import numpy as np
import wfdb
from scipy.io import loadmat
import math


def handle_wfdb(file_path, model_freq, model_signal_time):
    '''
    model_freq: frequency the model takes
    model_signal_time: signal length the model takes in seconds
    ''' 

    file_path2, file_extension = os.path.splitext(file_path)
    dirpath = os.path.dirname(file_path)
    header = file_path2 + ".hea"
    if not os.path.exists(header):
        raise ValueError("Header file does not exist!")
        
    record = None
    if file_path.endswith('.dat'):
        record = wfdb.rdrecord(file_path2)
        signal = record.p_signal
    elif file_path.endswith('.mat'):
        record = wfdb.rdheader(file_path2)
        signal = loadmat(file_path2)['val'].transpose()

    model_signal_int = model_signal_time * model_freq
    
    if (record.fs != model_freq): 
        raise ValueError("Incorrect frequency")
    
    if record.sig_len > model_signal_int:
        num_intervals = math.ceil(record.sig_len / model_signal_int)
        intervals = np.empty((num_intervals, model_signal_int), dtype=float)
        for i in range(num_intervals):
            start = i * model_signal_int
            end = start + model_signal_int
            interval = signal[start:end]

            if i == num_intervals - 1 and len(interval) < model_signal_int:
                interval = signal[-model_signal_int:]

        np.append(intervals, np.array([interval]), axis=0)
    else:
        intervals = np.array([signal])

    return intervals