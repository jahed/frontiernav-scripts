#!/usr/bin/env bash

dir=$1

if [ ! -d "${dir}" ]; then
    echo "Not a directory. ${dir}"
    exit -1
fi

find "${dir}" -type f | while read file
do
    ./square.sh "${file}"
done
