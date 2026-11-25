#!/usr/bin/env bash
# Folha de contato com quadros do vídeo e timestamp, para ver gestos e posições.
# Uso: quadros.sh VIDEO PASTA_SAIDA [intervalo_s=3] [inicio_s=0] [largura=160]
set -e
V="$1"; O="$2"; I="${3:-3}"; S="${4:-0}"; W="${5:-160}"
mkdir -p "$O"; rm -f "$O"/q_*.png "$O"/folha_*.png
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
ffmpeg -loglevel error -ss "$S" -i "$V" -vf "fps=1/$I,scale=$W:-1,drawtext=fontfile=$FONT:text='%{pts\:hms\:$S}':fontcolor=yellow:fontsize=14:x=4:y=4:box=1:boxcolor=black" "$O/q_%03d.png"
N=$(ls "$O"/q_*.png | wc -l); P=0; i=1
while [ $i -le $N ]; do
  ffmpeg -loglevel error -y -start_number $i -i "$O/q_%03d.png" -frames:v 1 -vf "tile=7x3" "$O/folha_$P.png"
  i=$((i+21)); P=$((P+1))
done
ls "$O"/folha_*.png
