#!/usr/bin/env bash
# Regenerates the home-screen PNGs in public/. Re-run after changing brand colors.
# Uses macOS qlmanage/sips so the repo needs no image dependencies.
set -euo pipefail

cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

primary="#c56a4a"
soft="#f3e3db"
accent="#b15c6b"

glyph='<rect x="7" y="9" width="18" height="16" rx="3" fill="#ffffff"/>
  <rect x="10" y="6" width="2.5" height="5" rx="1.25" fill="#ffffff"/>
  <rect x="19.5" y="6" width="2.5" height="5" rx="1.25" fill="#ffffff"/>
  <rect x="7" y="13" width="18" height="2.5" fill="'"$soft"'"/>
  <circle cx="20.5" cy="20" r="3" fill="'"$accent"'"/>'

# Square and full-bleed: the OS applies its own rounding, and transparent
# corners render as black on iOS.
cat > "$tmp/app.svg" <<EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="$primary"/>
  $glyph
</svg>
EOF

# Maskable: launchers may crop to a circle, so the glyph is scaled into the
# safe zone (the centred circle of 80% diameter).
cat > "$tmp/maskable.svg" <<EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="$primary"/>
  <g transform="translate(16,16) scale(0.8) translate(-16,-15.5)">
    $glyph
  </g>
</svg>
EOF

render() { # <svg> <size> <output name>
  qlmanage -t -s "$2" -o "$tmp" "$1" >/dev/null 2>&1
  sips -z "$2" "$2" "$tmp/$(basename "$1").png" --out "public/$3" >/dev/null
}

render "$tmp/app.svg" 180 apple-touch-icon.png
render "$tmp/app.svg" 192 icon-192.png
render "$tmp/app.svg" 512 icon-512.png
render "$tmp/maskable.svg" 512 icon-maskable-512.png

echo "Wrote apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png to public/"
