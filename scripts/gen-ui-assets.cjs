'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'src', 'common', 'images');

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

function renderSvgPng(browser, width, height, svgBody, outFile) {
  const tmp = path.join(os.tmpdir(), `bb-ui-${Date.now()}-${Math.random().toString(16).slice(2)}.html`);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${width}px; height: ${height}px; overflow: hidden; background: transparent !important; }
  </style></head><body>${svgBody}</body></html>`;
  fs.writeFileSync(tmp, html, 'utf8');
  try {
    execFileSync(
      browser,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--default-background-color=00000000',
        `--window-size=${width},${height}`,
        `--screenshot=${outFile}`,
        `file:///${tmp.replace(/\\/g, '/')}`,
      ],
      { stdio: 'pipe' }
    );
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

function circleBtnSvg(innerPath) {
  return `<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <circle cx="36" cy="36" r="32" fill="#262626"/>
    ${innerPath}
  </svg>`;
}

function main() {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const browser = findBrowser();

  // Signature 无源流沙 header gradient fade overlay (336x96)
  const hdSvg = `<svg width="336" height="96" viewBox="0 0 336 96" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hdg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="1"/>
        <stop offset="68%" stop-color="#000000" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="336" height="96" fill="url(#hdg)"/>
  </svg>`;
  renderSvgPng(browser, 336, 96, hdSvg, path.join(IMG_DIR, 'hd.png'));

  const icons = {
    'back_rect.png': circleBtnSvg(
      '<path d="M40 24 L27 36 L40 48" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
    'more_rect.png': circleBtnSvg(
      '<circle cx="24" cy="36" r="3.4" fill="#FFFFFF"/><circle cx="36" cy="36" r="3.4" fill="#FFFFFF"/><circle cx="48" cy="36" r="3.4" fill="#FFFFFF"/>'
    ),
    'add_rect.png': circleBtnSvg(
      '<path d="M36 24 L36 48 M24 36 L48 36" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>'
    ),
    'search_rect.png': circleBtnSvg(
      '<circle cx="33" cy="33" r="10.5" fill="none" stroke="#FFFFFF" stroke-width="4"/><path d="M41 41 L48 48" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>'
    ),
    'check_rect.png': `<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="36" r="32" fill="#0D84FF"/>
      <path d="M24 36.5 L32.5 45 L48 27" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    'refresh_rect.png': circleBtnSvg(
      '<path d="M46 31 A12 12 0 1 0 47.5 39" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/><path d="M48 24 L48 32 L40 32" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
  };

  for (const [name, svg] of Object.entries(icons)) {
    const out = path.join(IMG_DIR, name);
    renderSvgPng(browser, 72, 72, svg, out);
    console.log('Generated UI asset:', out, fs.statSync(out).size, 'bytes');
  }
}

main();
