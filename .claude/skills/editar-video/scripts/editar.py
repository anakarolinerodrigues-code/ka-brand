"""Renderiza um vídeo a partir de um plano de edição (plano.json).
Uso: python3 -I editar.py PLANO.json SAIDA.mp4 [--rascunho]

Todos os tempos do plano (cortes, efeitos, sons, final_congelado) são do VÍDEO ORIGINAL,
em segundos. O script remapeia para a linha do tempo final (após cortes e velocidade).
Um som com "t_final" em vez de "t" usa o tempo do vídeo final (útil depois do congelamento).
Formato completo do plano: ver SKILL.md."""
import json, os, sys, shutil, subprocess, glob, re
import numpy as np

plano_path, saida = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
rascunho = "--rascunho" in sys.argv
P = json.load(open(plano_path))
PD = os.path.dirname(plano_path)
K = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = os.path.join(K, "remotion"); JOB = os.path.join(R, "public", "job")
FPS = P.get("fps", 30); LARG, ALT = P.get("formato", [1080, 1920])
rel = lambda f: f if os.path.isabs(f) else os.path.join(PD, f)
run = lambda cmd: subprocess.run(cmd, check=True)

video = rel(P["video"])
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video],
                           capture_output=True, text=True, check=True).stdout)
cortes = P.get("cortes") or [[0, dur]]
cortes = [[max(0, a), min(dur, b)] for a, b in cortes]
vel = float(P.get("velocidade", 1))

def remap(t, ok_fora=False):
    off = 0
    for a, b in cortes:
        if a - 1e-3 <= t <= b + 1e-3:
            return round((off + min(max(t, a), b) - a) / vel, 3)
        off += b - a
    if ok_fora:
        return None
    sys.exit(f"ERRO: tempo {t}s cai num trecho cortado. Ajuste o plano.")

base_dur = sum(b - a for a, b in cortes) / vel

# valida o plano antes do trabalho pesado
for e in P.get("efeitos", []) + [x for x in P.get("sons", []) if "t" in x] + ([P["final_congelado"]] if P.get("final_congelado") else []):
    remap(e["t"])

# ---------- 1) base: cortes, cor, ruído, velocidade, formato (ffmpeg) ----------
shutil.rmtree(JOB, ignore_errors=True); os.makedirs(JOB)
vf_cor = ""
if P.get("cor", "auto") == "auto":  # balanço de branco "gray world" + leve contraste
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", video, "-vf", "fps=1/2,scale=64:-1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    m = np.frombuffer(raw, np.uint8).reshape(-1, 3).astype(float).mean(0)
    g = np.clip(m.mean() / m, 0.85, 1.15)
    vf_cor = f"colorchannelmixer=rr={g[0]:.3f}:gg={g[1]:.3f}:bb={g[2]:.3f},eq=contrast=1.08:saturation=1.08,"
elif P.get("cor") not in (None, "nenhuma"):
    vf_cor = P["cor"] + ","  # filtro ffmpeg livre, ex.: "lut3d=marca.cube"
af = "afftdn=nf=-25," if P.get("reducao_ruido", True) else ""
n = len(cortes)
fc = "".join(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS[a{i}];" for i, (a, b) in enumerate(cortes))
fc += "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[cv][ca];"
fc += (f"[cv]{vf_cor}setpts=PTS/{vel},scale={LARG}:{ALT}:force_original_aspect_ratio=increase,crop={LARG}:{ALT},fps={FPS},format=yuv420p[ov];"
       f"[ca]{af}atempo={vel},loudnorm=I=-16:TP=-1.5,aresample=48000[oa]")
base = os.path.join(JOB, "base.mp4")
run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-filter_complex", fc, "-map", "[ov]", "-map", "[oa]",
     "-c:v", "libx264", "-crf", "16", "-preset", "veryfast", "-c:a", "aac", "-b:a", "192k", base])

# ---------- 2) legendas: palavras remapeadas, correções, destaques ----------
palavras = []
leg = P.get("legenda", {})
if P.get("transcricao") and leg.get("estilo") != "nenhuma":
    corr = leg.get("correcoes", {})
    dest = {d.upper() for d in leg.get("destaques", [])}
    ocultar = [tuple(x) for x in leg.get("ocultar", [])]  # trechos [a,b] sem legenda (ex.: comandos ao Claude)
    for seg in json.load(open(rel(P["transcricao"]))):
        for w in seg["words"]:
            txt = w["w"].strip()
            for k, v in corr.items():
                txt = re.sub(rf"\b{re.escape(k)}\b", v, txt)
            if not txt or any(a <= w["s"] <= b for a, b in ocultar):
                continue
            s = remap(w["s"], True); e = remap(w["e"], True)
            if s is None:
                continue
            nucleo = re.sub(r"[^\wÀ-ÿ]", "", txt).upper()
            palavras.append({"w": txt if not leg.get("sem_pontuacao", True) else re.sub(r"[.,;:]+$", "", txt),
                             "s": s, "e": e if e is not None else s + 0.3, "destaque": nucleo in dest})

# ---------- 3) efeitos e sons ----------
efeitos = []
for e in P.get("efeitos", []):
    e = dict(e); e["t"] = remap(e["t"]); e["dur"] = round(e.get("dur", 1) / vel, 3)
    for k in ("sprite", "emoji", "arquivo"):
        if k in e and re.search(r"\.(png|webp|svg|gif|jpg)$", str(e[k]), re.I):
            dst = os.path.join(JOB, os.path.basename(e[k])); shutil.copy(rel(e[k]), dst); e[k] = "job/" + os.path.basename(e[k])
    efeitos.append(e)

fz = P.get("final_congelado")
total = base_dur
if fz:
    fz = dict(fz); fz["t"] = remap(fz["t"]); fz.setdefault("dur", 4)
    total = fz["t"] + fz["dur"]

sons = []
for i, s in enumerate(P.get("sons", [])):
    s = dict(s)
    s["t"] = s.pop("t_final") if "t_final" in s else remap(s["t"])
    nome = f"s{i}_" + os.path.basename(s["arquivo"])
    shutil.copy(rel(s["arquivo"]), os.path.join(JOB, nome)); s["arquivo"] = "job/" + nome
    sons.append(s)

marca = json.load(open(os.path.join(K, "marca.json")))
props = {"fps": FPS, "largura": LARG, "altura": ALT, "duracao": round(total, 3), "video": "job/base.mp4",
         "palavras": palavras, "legenda": leg, "efeitos": efeitos, "sons": sons, "final_congelado": fz, "marca": marca}
props_path = os.path.join(JOB, "props.json"); json.dump(props, open(props_path, "w"), ensure_ascii=False)

# ---------- 4) render (Remotion) + loudness final ----------
nav = os.environ.get("REMOTION_BROWSER") or next(iter(sorted(glob.glob("/opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell"))), None)
tmp = saida + ".tmp.mp4"
cmd = ["npx", "remotion", "render", "src/index.jsx", "Edicao", tmp, f"--props={props_path}", "--log=error", "--concurrency=4"]
if nav: cmd.append(f"--browser-executable={nav}")
if rascunho: cmd += ["--scale=0.5", "--crf=28"]
subprocess.run(cmd, check=True, cwd=R)
run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5", "-c:a", "aac", "-b:a", "192k",
     "-movflags", "+faststart", saida])
os.remove(tmp)
print(f"pronto: {saida}  ({total:.1f}s)")
