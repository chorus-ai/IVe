import json
import h5py
import sys
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
    
result = {}

#function to random access hdf5 file with start offset and range
def randomAccessHdf5File(filename, startOffset, range):
    # open hdf5 file
    f = h5py.File(filename, 'r')
    # read Waveforms group from hdf5 file
    waveform = f['/Waveforms']
    # read attributes from Waveforms group
    header = waveform.attrs
    result['StartTime'] = header['StartTime']
    result['OffsetInSec'] = header['OffsetInSec']
    result['TicksPerSec'] = header['TicksPerSec']
    result['SamplesPerChannel'] = int(header['TicksPerSec'])*int(range)

    temp = []
    # loop each channel data from Waveforms group
    for channel in waveform:
        # read channel data from Waveforms group
        channelData = waveform[channel]
        #print channelData using startOffset and range with TicksPerSec
        #print(channelData[int(startOffset):int(range)*int(header['TicksPerSec'])])
        # read attributes from channel data
        channelHeader = channelData.attrs   
        # print channelHeader
        # print(channelHeader.keys())
        # get channel data from dataset
        wData = {}
        wData['Channel'] = channelHeader['Channel']
        wData['UOM'] = channelHeader['UOM']
        wData['ID'] = channelHeader['ID']
        wData['Samples'] = channelData[int(startOffset)*int(header['TicksPerSec']):int(range)*int(header['TicksPerSec'])].tolist()
        temp.append(wData)
    result['WaveformData'] = temp

    # close hdf5 file
    f.close()

# read hdf5 file with args from nodejs
args = sys.argv[1:]
filename = args[0]
startOffset = args[1]
range = args[2]
# print('filename: ' + filename)
# print('startOffset: ' + startOffset)
# print('range: ' + range)
randomAccessHdf5File(filename, startOffset, range)

# json object to return to nodejs
print(json.dumps(result, cls=NpEncoder))