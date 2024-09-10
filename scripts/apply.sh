#!/usr/bin/env sh

HYPR_SHADERS_DIR=~/.config/hypr/shaders

set -e

state="$1"
shader="$2"

help() {
  echo -e "h-shaders scripts v1.0\n"
  echo "This script dynamically applies shaders to Hyprland using hyprctl"
  echo -e "It automatically switches damage_tracking if your script uses 'time'\n"
}

usage() {
  echo "Usage:" >&2
  echo "  ./apply.sh on sakura             \
  (~/.config/hypr/shaders/sakura.frag)" >&2
  echo "  ./apply.sh on ./path/sakura.frag \
  (path to the shader file)" >&2
  echo "  ./apply.sh off" >&2
}

error() {
  help
  echo -e "$1" >&2
  usage
  exit
}

[ "$1" = '--help' ] || [ "$1" = '--version' ] \
  && help \
  && usage \
  && exit

[ -z "$state" ] \
  && error "\nError: missing state (on/off)\n"

[ "$state" = "on" ] && [ -z "$shader" ] \
  && error "Error: missing shader name\n"

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
