#!/usr/bin/env bash
# Instala as ferramentas de edição (idempotente). Rode uma vez por sessão nova.
set -e
K="$(cd "$(dirname "$0")/.." && pwd)"
command -v ffmpeg >/dev/null || { apt-get update -q && apt-get install -y -q ffmpeg; }
command -v sox >/dev/null || { apt-get update -q && apt-get install -y -q sox; }
fc-list | grep -qi "Noto Color Emoji" || apt-get install -y -q fonts-noto-color-emoji || true
python3 -c "import faster_whisper" 2>/dev/null || pip install -q faster-whisper
[ -d "$K/remotion/node_modules/remotion" ] || (cd "$K/remotion" && npm install --silent --no-audit --no-fund)
echo "editar-video: ferramentas prontas"
