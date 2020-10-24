#!/bin/bash
yarn run build

target=/static/demo/raymarching-lab-2

echo "Synch to http://fforw.de/$target"

rsync -rvIz --rsh=ssh --delete --exclude=.git --exclude=*.blend ./docs/ newweb:/var/www/$target
