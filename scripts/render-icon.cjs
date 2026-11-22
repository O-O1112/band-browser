'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_LOGO = path.join(ROOT, 'src', 'common', 'logo.png');
const OUT_PLUGIN_ICON = path.join(ROOT, 'astrobox-plugin', 'icon.png');

function findBrowser() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Headless Edge/Chrome not found');
}

function buildPage(svgBody) {
  return `<!DOCTYPE html>
<html style="background:transparent;">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;width:192px;height:192px;overflow:hidden;background:transparent;">
  <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="roundedIcon">
        <rect x="0" y="0" width="192" height="192" rx="44" ry="44" />
      </clipPath>
    </defs>
    <g clip-path="url(#roundedIcon)">
      <!-- Full-bleed Vibrant Cobalt Sky -->
      <rect width="192" height="192" fill="#0D84FF" />
      <!-- Large Flowing Liquid Azure Wave sweeping full width -->
      <path d="M-8,118 Q48,78 96,108 T200,98 L200,200 L-8,200 Z" fill="#38BDF8" />
      <!-- Large Warm Champagne Quicksand Wave across lower edge -->
      <path d="M-8,146 Q52,174 106,138 T200,140 L200,200 L-8,200 Z" fill="#FDE68A" />
      ${svgBody}
    </g>
  </svg>
</body>
</html>`;
}

// App Icon: Bold Oversized Flat 45-deg Compass Needle
const APP_HTML = buildPage(`
  <polygon points="154,38 111,111 81,81" fill="#FFFFFF" />
  <polygon points="38,154 81,81 111,111" fill="#0F172A" />
  <circle cx="96" cy="96" r="7" fill="#0D84FF" />
`);

// Companion Module Icon: Matching Liquid Palette with Cleanly Spaced Bidirectional Sync Arrows
const PLUGIN_HTML = buildPage(`
  <!-- Upper right-pointing relay arrow (White) -->
  <path d="M44,58 H108 V42 L152,66 L108,90 V74 H44 Z" fill="#FFFFFF" />
  <!-- Lower left-pointing return arrow (Obsidian Slate) -->
  <path d="M148,118 H84 V102 L40,126 L84,150 V134 H148 Z" fill="#0F172A" />
`);

function captureIcon(browser, html, outPath) {
  const tmpHtml = path.join(os.tmpdir(), `bb-icon-${Date.now()}-${Math.random().toString(16).slice(2)}.html`);
  const tmpProfile = path.join(os.tmpdir(), `bb-edge-prof-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  fs.writeFileSync(tmpHtml, html, 'utf8');
  try {
    execFileSync(
      browser,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--hide-scrollbars',
        '--default-background-color=00000000',
        '--force-device-scale-factor=1',
        `--user-data-dir=${tmpProfile}`,
        '--window-size=192,192',
        `--screenshot=${outPath}`,
        `file:///${tmpHtml.replace(/\\/g, '/')}`,
      ],
      { stdio: 'pipe' }
    );
  } finally {
    if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
    if (fs.existsSync(tmpProfile)) fs.rmSync(tmpProfile, { recursive: true, force: true });
  }
  console.log(`Rendered flat icon (${fs.statSync(outPath).size} bytes): ${outPath}`);
}

function main() {
  const browser = findBrowser();
  captureIcon(browser, APP_HTML, OUT_LOGO);
  captureIcon(browser, PLUGIN_HTML, OUT_PLUGIN_ICON);
}

main();
