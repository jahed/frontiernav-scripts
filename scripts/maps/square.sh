#!/usr/bin/env bash
set -ex

file=$1

if [ ! -f "${file}" ]; then
    echo "Not a file. ${file}"
    exit -1
fi

dim=$(identify -format '%[fx:((w>h)?w:h)]' "${file}")
mkdir -p ./squared/
mogrify \
    -resize "${dim}x${dim}" \
    -extent "${dim}x${dim}" \
    -gravity center \
    -background transparent \
    -format tif \
    -path ./squared/ \
    "${file}"
