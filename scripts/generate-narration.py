"""Synthesize the overview narration locally. Install kokoro-onnx and soundfile.
Use KOKORO_MODEL / KOKORO_VOICES for model-files-v1.1 assets; see WEBSITE.md.
The committed WAV and timing file let the film render without a voice model.
"""
import json, os, pathlib
import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro
root = pathlib.Path(__file__).resolve().parent.parent
ort.set_default_logger_severity(3)
engine = Kokoro(os.environ['KOKORO_MODEL'], os.environ['KOKORO_VOICES'])
cues = json.loads((root / 'scripts/narration.json').read_text())
audio, cursor, timing = [], 0, []
sr = 24000
for cue in cues:
    samples, sr = engine.create(cue.get('spoken', cue['text']), voice='af_heart', speed=1.03, lang='en-us')
    # Brief breathing room between ideas; the feedback sequence gets the most time.
    before, after = 0.18, 0.38
    duration = before + len(samples) / sr + after
    if cue['id'] == 'feedback': duration = max(duration, 10)
    audio.extend([np.zeros(round(before*sr)), samples, np.zeros(round((duration-before-len(samples)/sr)*sr))])
    timing.append(dict(id=cue['id'], start=round(cursor,3), duration=round(duration,3), voiceStart=round(cursor+before,3), voiceEnd=round(cursor+before+len(samples)/sr,3), text=cue['text']))
    cursor += duration
    print(cue['id'], round(duration,2), flush=True)
track = np.concatenate(audio)
# Gentle peak normalization preserves the voice's phrasing and dynamics.
track *= min(1.0, 0.9 / max(abs(track)))
sf.write(root / 'static/audio/overview-narration.wav', track, sr, subtype='PCM_16')
(root / 'static/audio/overview-timing.json').write_text(json.dumps(timing, indent=2)+'\n')
def stamp(s):
    ms=round(s*1000); return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
vtt=['WEBVTT','']
# Split sentence-level captions proportionally, retaining the exact spoken copy.
import re
for cue in timing:
    sentences = re.split(r'(?<=[.!?])\s+',cue['text'])
    total=sum(len(s) for s in sentences); at=cue['voiceStart']
    for sentence in sentences:
        end=at+(cue['voiceEnd']-cue['voiceStart'])*len(sentence)/total
        vtt.extend([f'{stamp(at)} --> {stamp(end)}',sentence,'']); at=end
(root / 'static/videos/unipred-overview.vtt').write_text('\n'.join(vtt))
print('Narration length:',len(track)/sr,'seconds')
