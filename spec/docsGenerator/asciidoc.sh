#!/usr/bin/env bash
set -e

# Prepare actual values for documentation header.
values="{ \"version\": \"${VERSION}\", \"environment\": \"${ENV}\", \"host\": \"${HOST}\" }"

# Build header file from template with actual values > `spec/header.yaml`.
echo ${values} | node_modules/.bin/mustache - spec/header.yaml.tpl > spec/header.yaml

# Generate spec in OpenAPI 2.0 format > `spec/swagger.json`.
node_modules/.bin/tinyspec --json -o spec/

# Generate docs in AsciiDoc format > `spec/docsGenerator/index.adoc`.
/usr/bin/java -jar spec/docsGenerator/swagger2markup-cli-1.3.1.jar convert \
    -i spec/swagger.json \
    -f spec/docsGenerator/index \
    -c spec/docsGenerator/config.properties

# Convert AsciiDoc to HTML > `spec/docsGenerator/index.html`.
asciidoctor -a toc=left -a toclevels=3 -a sectanchors spec/docsGenerator/index.adoc

# Clean up output folder.
rm -rf docs/*

# Move HTML docs to output folder.
mv spec/docsGenerator/index.html docs/

# Clean up build folder.
rm spec/docsGenerator/index*
