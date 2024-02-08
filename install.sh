#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "missing shader name"
  exit
fi

HYPR_CONFIG=~/.config/hypr

mkdir -pv ${HYPR_CONFIG}/shaders

cp -v ./src/shaders/"$1".frag ${HYPR_CONFIG}/shaders
