---
name: editar-video
description: Edita vídeos da KA Brand do zero (decupagem, legenda saltando, correção de cor, redução de ruído, efeitos sonoros, motion, transições, zoom, final congelado) seguindo comandos falados no próprio vídeo ("Claude, coloca X aqui"). Use sempre que a Ana mandar um vídeo para editar, pedir Reels/TikTok/Shorts, legendas, cortes, efeitos ou motion num vídeo.
---

# Edição de vídeo KA Brand (comandos por voz)

A Ana grava falando normalmente e, quando quer um efeito, **fala com o Claude no vídeo**
("Claude, bota um relógio aqui em cima da minha cabeça") e aponta com a mão. Seu trabalho:
encontrar cada comando, entender onde/quando aplicar (fala + gesto) e montar a edição.

Tudo roda aqui: ffmpeg (base), faster-whisper (transcrição), Remotion (motion/legendas/sons).
Pasta da skill: `.claude/skills/editar-video/` (abaixo chamada `$K`).
Trabalhe numa pasta de trabalho no scratchpad (`$W`), nunca dentro do repositório.

## Fluxo

1. **Preparar** (uma vez por sessão): `bash $K/scripts/setup.sh`
2. **Transcrever**:
   `HF_HUB_DISABLE_XET=1 python3 -I $K/scripts/transcrever.py VIDEO $W/transcricao.json`
   (use `medium` como 3º argumento se a fala for difícil; corrija nomes na legenda: o Whisper
   escreve "Cláudio" para "Claude" e "Ka-Brand" para "KA Brand").
3. **Assistir**: `bash $K/scripts/quadros.sh VIDEO $W/quadros 3` e leia as folhas (Read).
   Para cada comando, gere quadros mais densos no trecho (`quadros.sh VIDEO $W/q2 0.5 INICIO 288`)
   para ver o gesto: de onde para onde ("daqui pra cá"), onde fica "aqui em cima", quando ela
   "joga pra cima". **Os gestos costumam acontecer em silêncio, logo depois da fala.**
4. **Roteiro de edição → mostrar à Ana antes de renderizar.** Tabela curta: tempo, comando
   ouvido, o que você vai fazer, som. Pergunte também se os trechos em que ela fala com o
   Claude devem ser cortados do vídeo final (vídeos da loja: normalmente sim; vídeos
   "bastidores" mostrando a edição: não).
5. **Plano** (`$W/plano.json`, formato abaixo). Para os cortes:
   `python3 -I $K/scripts/cortes.py $W/transcricao.json 0.6 A-B ...` (passe como protegidas as
   janelas de gesto/efeito para não serem cortadas como "silêncio").
6. **Rascunho**: `python3 -I $K/scripts/editar.py $W/plano.json $W/rascunho.mp4 --rascunho`
   Confira com quadros nos momentos dos efeitos (ou `npx remotion still` em `$K/remotion`
   com `--props=public/job/props.json --frame=N`). Corrija e só então:
7. **Final**: `python3 -I $K/scripts/editar.py $W/plano.json $W/final.mp4` → envie com
   SendUserFile e lembre que o container é temporário (ela deve baixar ou mandar pro Drive).

## Plano (plano.json)

Tempos sempre em segundos **do vídeo original**; o script remapeia após cortes/velocidade e
avisa se um tempo cair num trecho cortado. Caminhos relativos ao plano.

```json
{
  "video": "bruto.mp4",
  "transcricao": "transcricao.json",
  "formato": [1080, 1920],
  "cortes": [[0, 12.4], [13.1, 40]],
  "velocidade": 1.1,
  "cor": "auto",
  "reducao_ruido": true,
  "legenda": {
    "estilo": "saltando",
    "chip": false, "chip_a_partir_de": 60,
    "tamanho": 64, "max_palavras": 3,
    "correcoes": {"Cláudio": "Claude"},
    "destaques": ["COLEÇÃO", "PROMOÇÃO"],
    "ocultar": [[5.0, 9.2]]
  },
  "efeitos": [
    {"tipo": "voo", "t": 20, "dur": 1.6, "de": [0.6, 0.35], "para": [1.25, 0.1], "sprite": "heroi", "tamanho": 0.32},
    {"tipo": "emoji", "t": 37, "dur": 8, "emoji": "⏰", "x": 0.5, "y": 0.13, "anim": "tremer"},
    {"tipo": "zoom", "t": 47, "dur": 7, "de": 1, "para": 1.45, "x": 0.5, "y": 0.33},
    {"tipo": "transicao", "t": 63, "dur": 0.4, "direcao": "lado"},
    {"tipo": "explosao", "t": 76, "dur": 0.8, "x": 0.5, "y": 0.35},
    {"tipo": "texto", "t": 76, "dur": 1.4, "texto": "KABUM!", "y": 0.5},
    {"tipo": "tremor", "t": 80, "dur": 0.5},
    {"tipo": "imagem", "t": 81, "dur": 3, "arquivo": "logo.png", "x": 0.5, "y": 0.2, "tamanho": 0.4},
    {"tipo": "lista", "t": 82, "dur": 8, "titulo": "O que tem", "titulo_destaque": "na coleção", "itens": ["..."], "rodape": "..."}
  ],
  "sons": [
    {"arquivo": "sons/whoosh.wav", "t": 20, "volume": 0.4},
    {"arquivo": "sons/tictac.wav", "t": 37, "dur": 8, "loop": true, "volume": 0.3},
    {"arquivo": "sons/tensao.mp3", "t": 47, "dur": 7, "volume": 0.5, "fade_in": 1, "fade_out": 1},
    {"arquivo": "sons/novela.mp3", "t_final": 103.4, "dur": 4, "volume": 0.6}
  ],
  "final_congelado": {"t": 115.2, "dur": 4, "pb": true, "zoom": true, "vinheta": true}
}
```

- Coordenadas `x`, `y`, `de`, `para`: fração da tela (0–1; fora disso entra/sai da tela).
- `estilo` da legenda: `saltando` (pula pela tela, evitando o rosto), `fixa` (embaixo) ou `nenhuma`.
  `chip: true` põe cada palavra numa caixinha; `destaques` ficam grandes (alternando caixa-alta
  e itálico elegante na cor de destaque). `ocultar` tira a legenda de trechos.
- `cor`: `"auto"` (balanço de branco + contraste leve), `"nenhuma"` ou filtro ffmpeg livre
  (ex.: `"lut3d=marca.cube"` para a LUT da marca).
- `transicao.direcao`: `lado`, `direita` ou `cima`. Combine `transicao` + `explosao` + `texto`
  para a "transição pra cima com explosão".
- `sprite` do voo: `heroi` (super-herói genérico desenhado), um emoji, ou PNG da Ana.
- Sons: `t_final` = tempo no vídeo final (para depois do congelamento).

## Regras de bom gosto

- **Efeitos sonoros baixinhos**: 0.3–0.45 de volume; nunca alto por cima da fala. Música
  de fundo 0.15–0.25 com fade.
- Legenda: no máximo 3 palavras por vez; destaque só as palavras-chave (1 a cada 2–3 blocos).
- Nada sobre o rosto: rosto fica no centro-alto (≈ y 0.25–0.45). Confira nos quadros.
- Cores e fontes vêm de `$K/marca.json` (provisórias até a Ana enviar as da KA Brand: ao
  receber, atualize esse arquivo e faça commit).
- Sons: use os arquivos da Ana (pasta de sons no Drive) quando houver; `sons_basicos.sh`
  gera reservas sintéticas simples (whoosh, pop, tictac, boom, tensao).
- **Direitos**: não use personagens de marca registrada (ex.: Superman) nem músicas
  protegidas (ex.: tema de novela). Use o herói genérico e trilhas livres/licenciadas pela Ana,
  e diga isso a ela quando ela pedir algo assim.
- Material de entrada: peça o arquivo original da câmera (vídeos baixados do TikTok/Instagram
  vêm em baixa resolução e já com marca d'água). Arquivo grande → link do Google Drive.

## Problemas conhecidos

- Download do modelo Whisper falha via xet → sempre `HF_HUB_DISABLE_XET=1`.
- PyAV incompatível com faster-whisper → `transcrever.py` já decodifica com ffmpeg.
- Remotion acha o Chromium em `/opt/pw-browsers/...`; fora dele, defina `REMOTION_BROWSER`.
- Render completo de ~2 min de vídeo leva ~5 min; use `--rascunho` para iterar.
