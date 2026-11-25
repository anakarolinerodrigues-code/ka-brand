"""Transcreve um vídeo com tempo por palavra.
Uso: python3 -I transcrever.py VIDEO SAIDA.json [modelo: small|medium]
Rode com HF_HUB_DISABLE_XET=1 (o download via xet é bloqueado no proxy)."""
import sys, json, subprocess
import numpy as np
from faster_whisper import WhisperModel

video, saida = sys.argv[1], sys.argv[2]
modelo = sys.argv[3] if len(sys.argv) > 3 else "small"
# decodifica via ffmpeg (o PyAV instalado pode ser incompatível com faster-whisper)
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", video, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
m = WhisperModel(modelo, device="cpu", compute_type="int8")
segs, _ = m.transcribe(audio, language="pt", word_timestamps=True, vad_filter=True)
out = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
        "words": [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for w in s.words]} for s in segs]
json.dump(out, open(saida, "w"), ensure_ascii=False, indent=1)
for s in out:
    print(f'{s["start"]:7.2f}-{s["end"]:7.2f}  {s["text"]}')
