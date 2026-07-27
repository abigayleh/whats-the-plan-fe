#!/usr/bin/env bash
# Regenerates public/og-image.png, the 1200x630 link-preview card. Re-run after changing
# the site name, tagline, or brand colors. Uses macOS qlmanage/sips — no image dependencies.
set -euo pipefail

cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

primary="#c56a4a"
bg="#fbfaf7"
text="#2c2823"
muted="#8d8578"
soft="#f3e3db"
accent="#b15c6b"
font="Hanken Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"

# qlmanage only ever emits a square thumbnail, and a non-square source gets cropped to fit
# it. So draw the 1200x630 card into the middle of a 1200x1200 canvas and crop it back out.
cat > "$tmp/og.svg" <<EOF
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <rect width="1200" height="1200" fill="$bg"/>
  <g transform="translate(0,285)">
    <rect width="1200" height="630" fill="$bg"/>
    <rect width="1200" height="12" fill="$primary"/>
    <g transform="translate(96,120) scale(3)">
      <rect x="7" y="9" width="18" height="16" rx="3" fill="$primary"/>
      <rect x="10" y="6" width="2.5" height="5" rx="1.25" fill="$primary"/>
      <rect x="19.5" y="6" width="2.5" height="5" rx="1.25" fill="$primary"/>
      <rect x="7" y="13" width="18" height="2.5" fill="$soft"/>
      <circle cx="20.5" cy="20" r="3" fill="$accent"/>
    </g>
    <text x="96" y="340" font-family="$font" font-size="86" font-weight="700" fill="$text">What&#8217;s the Plan?</text>
    <text x="96" y="415" font-family="$font" font-size="33" fill="$muted">Collaborative planning for groups &#8212; a shared calendar,</text>
    <text x="96" y="462" font-family="$font" font-size="33" fill="$muted">to-do lists, polls, itineraries, pages, and real-time chat.</text>
  </g>
</svg>
EOF

qlmanage -t -s 1200 -o "$tmp" "$tmp/og.svg" >/dev/null 2>&1
sips -c 630 1200 "$tmp/og.svg.png" --out public/og-image.png >/dev/null

echo "Wrote public/og-image.png ($(sips -g pixelWidth -g pixelHeight public/og-image.png | tail -2 | tr -d ' \n'))"