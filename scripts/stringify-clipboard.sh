#!/usr/bin/env bash

pbpaste | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0, "utf8")))' | pbcopy
echo "JSON-ready string copied to clipboard."
