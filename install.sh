#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "missing shader name"
  exit
fi

HYPR_SHADERS_DIR=~/.config/hypr/shaders
LOCAL_SHADERS_DIR=./src/public/shaders

mkdir -pv ${HYPR_SHADERS_DIR}

cp -v "${LOCAL_SHADERS_DIR}/$1".frag ${HYPR_SHADERS_DIR}
