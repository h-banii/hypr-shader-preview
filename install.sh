#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "missing shader name"
  exit
fi

HYPR_CONFIG=~/.config/hypr
SHADERS=./src/public/shaders

mkdir -pv ${HYPR_CONFIG}/shaders

cp -v "${SHADERS}/$1".frag ${HYPR_CONFIG}/shaders
