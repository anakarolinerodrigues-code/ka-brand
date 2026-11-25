#!/usr/bin/env bash
# Gera sons sintéticos simples de reserva (use os arquivos da Ana em assets/sons quando houver).
set -e
O="${1:-.}"; mkdir -p "$O"; cd "$O"
sox -n -r 44100 -c 2 whoosh.wav synth 0.6 pinknoise fade q 0.25 0.6 0.35 sinc 1500-8000 gain -8
sox -n -r 44100 -c 2 pop.wav synth 0.08 sine 900-300 fade q 0 0.08 0.06 gain -12
sox -n -r 44100 -c 2 tic.wav synth 0.03 sine 2400 fade q 0 0.03 0.02 gain -10 pad 0 0.47
sox tic.wav tic.wav tic.wav tic.wav tic.wav tic.wav tic.wav tic.wav tictac.wav
sox -n -r 44100 -c 2 boom.wav synth 1.4 brownnoise synth 1.4 sine mix 60-30 fade q 0.01 1.4 1.2 lowpass 400 gain -3
sox -n -r 44100 -c 2 tensao.wav synth 8 sine 55 sine 58.3 tremolo 4 60 fade q 1 8 1 gain -14
ls
