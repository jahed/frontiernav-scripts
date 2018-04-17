#!/usr/bin/env bash

command=$1
dir=$2
format=$3

if [ -z "${command}" ]; then
    echo "Need an im-map-tiles.sh path"
    exit -1
fi

if [ ! -d "${dir}" ]; then
    echo "Need an existing input directory. ${dir}"
    exit -1
fi

if [ -z "${format}" ]; then
    echo "Need an output image format"
    exit -1
fi

find "${dir}" -type f | while read file
do
    filename="$(basename "$file")"
    out_dir="./tiles_${format}/${filename:0:-4}"
    if [ ! -d "${out_dir}" ]; then
        mkdir -p "${out_dir}"
        ${command} "${file}" "${out_dir}" "${format}"
    fi
done
