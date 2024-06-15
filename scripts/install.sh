#!/usr/bin/env bash

# This moves a shader from ./src/public/shaders to ~/.config/hypr/shaders

if [ -z "$1" ]; then
  printf "Error: missing shader name\n\n" >&2
  printf "Usage: ./install.sh sakura\n\n" >&2
  printf "(this assumes there's a sakura.frag \
file inside ./src/public/shaders/)\n" >&2
  exit
fi

HYPR_SHADERS_DIR=~/.config/hypr/shaders
LOCAL_SHADERS_DIR=./src/public/shaders

mkdir -pv ${HYPR_SHADERS_DIR}

cp -v "${LOCAL_SHADERS_DIR}/$1".frag ${HYPR_SHADERS_DIR}
