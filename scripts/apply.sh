#!/usr/bin/env bash

# This script can be placed and executed from anywhere,
# the only thing it assumes is that shaders are here:
HYPR_SHADERS_DIR=~/.config/hypr/shaders

set -e

state="$1"
shader="$2"

help() {
  echo "This script dynamically applies shaders to Hyprland using hyprctl"
  echo -e "It automatically switches damage_tracking if you script uses 'time'\n"
}

usage() {
  echo "Usage:" >&2
  echo "  ./apply.sh on shader" >&2
  echo "  ./apply.sh off" >&2
  echo -e "(this assumes there's a shader.frag \
file inside ~/.config/hypr/shaders)\n" >&2
}

[ "$1" = '--help' ] \
  && help \
  && usage \
  && exit

[ -z "$state" ] \
  && help \
  && echo -e "\nError: missing state (on/off)\n" >&2 \
  && usage \
  && exit

[ "$state" = "on" ] && [ -z "$shader" ] \
  && help \
  && echo -e "Error: missing shader name\n" >&2 \
  && usage \
  && exit

[[ "$shader" == *"/"* ]] \
  && shader=$(realpath "${shader}") \
  || shader="${HYPR_SHADERS_DIR}/$shader".frag

check() {
  [ "$1" = "ok" ] && return 0 \
    || [ "${1//$'\n'/}" = "okok" ] && return 0 \
    || return 1;
}

needs_damage_tracking() {
  grep -q 'uniform .* time' "${shader}" && return 0 || return 1
}

damage_tracking_is_active() {
  damage_tracking=$(hyprctl getoption debug:damage_tracking | awk 'NR==1{print $2}')
  [ "${damage_tracking}" -eq 0 ] && return 0 || return 1
}

check $(if [ "$state" = 'on' ]; then
  if [ ! -f "$shader" ]; then
    echo "shader '${shader}' not found" >&2
    exit 1
  fi

  if needs_damage_tracking; then
    hyprctl --batch "\
      keyword debug:damage_tracking 0 ;\
      keyword decoration:screen_shader ${shader}"
  else
    hyprctl keyword decoration:screen_shader "${shader}"
  fi
else
  # OBS.: for some reason it gives an error if I try to batch it
  hyprctl keyword decoration:screen_shader ""
  if damage_tracking_is_active; then
    hyprctl keyword debug:damage_tracking 2
  fi
fi) && echo ok || echo nok
