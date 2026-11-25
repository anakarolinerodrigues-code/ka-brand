"""Sugere cortes (trechos a manter) a partir da transcrição, removendo pausas,
mas PROTEGENDO janelas de ação/efeito (gestos costumam acontecer em silêncio).
Uso: python3 -I cortes.py TRANSCRICAO.json [pausa_min=0.6] [protegido a-b ...]
Ex.: python3 -I cortes.py transcricao.json 0.6 75.5-77.5 112-116
Imprime a lista JSON para colar em "cortes" no plano."""
import json, sys
segs = json.load(open(sys.argv[1]))
pausa = float(sys.argv[2]) if len(sys.argv) > 2 else 0.6
prot = [tuple(map(float, x.split("-"))) for x in sys.argv[3:]]
trechos = [[max(0, s["start"] - 0.12), s["end"] + 0.2] for s in segs] + [list(p) for p in prot]
trechos.sort()
out = []
for a, b in trechos:
    if out and a - out[-1][1] < pausa:
        out[-1][1] = max(out[-1][1], b)
    else:
        out.append([a, b])
print(json.dumps([[round(a, 2), round(b, 2)] for a, b in out]))
