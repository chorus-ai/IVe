import os
import numpy as np
import json
import wfdb
from scipy.io import loadmat
import math
from data_handlers.csv_handler import handle_csv
from data_handlers.wfdb_handler import handle_wfdb
from data_handlers.json_handler import handle_json
from scipy.signal import resample

def handleData(file_type, file_path, model_freq, model_signal_int):

    data = None
    if file_type == 'fp':
        if file_path.endswith('.csv'):
            data = handle_csv(file_path, model_freq, model_signal_int)
        elif file_path.endswith('.json'):
            with open(file_path, 'r') as f:
                file = json.load(f)
        elif file_path.endswith('.dat') or file_path.endswith('.mat'):
            data = handle_wfdb(file_path, model_freq, model_signal_int)
        else:
            data = np.fromfile(file_path, dtype='float')
    else:
        data = np.fromstring(file_path, dtype=float, sep=',', count=-1)
        
        if len(file_path.split(",")) < model_freq * model_signal_int:
            raise ValueError("Incorrect frequency or signal length!")
        
        if len(file_path.split(",")) > model_freq * model_signal_int:
            # downsample signal
            data = resample(data, model_freq * model_signal_int)

    if data.ndim == 1:
        data = np.array([data])

    return data