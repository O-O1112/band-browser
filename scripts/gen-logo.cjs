'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_LOGO = path.join(ROOT, 'src', 'common', 'logo.png');
const PLUGIN_ICON = path.join(ROOT, 'astrobox-plugin', 'icon.png');

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

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 192px; height: 192px; overflow: hidden; background: #09101D; }
  .wrap {
    width: 192px; height: 192px; border-radius: 44px;
    background: radial-gradient(circle at 26% 20%, #0EA5E9 0%, #0F172A 64%, #060B16 100%);
    border: 4px solid #38BDF8;
    display: flex; align-items: center; justify-content: center;
  }
</style></head><body>
  <div class="wrap">
    <svg width="132" height="132" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="44" fill="#0B192E" stroke="#E0F2FE" stroke-width="5"/>
      <ellipse cx="60" cy="60" rx="20" ry="44" fill="none" stroke="#38BDF8" stroke-width="4"/>
      <line x1="16" y1="60" x2="104" y2="60" stroke="#38BDF8" stroke-width="4"/>
      <path d="M22 39 Q60 47 98 39" fill="none" stroke="#7DD3FC" stroke-width="3.2"/>
      <path d="M22 81 Q60 73 98 81" fill="none" stroke="#7DD3FC" stroke-width="3.2"/>
      <!-- Compass / rocket cursor accent -->
      <path d="M84 22 L98 36 L74 46 Z" fill="#34D399" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
    </svg>
  </div>
</body></html>`;

function main() {
  const browser = findBrowser();
  const tmp = path.join(os.tmpdir(), `bb-logo-${Date.now()}.html`);
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
        '--window-size=192,192',
        `--screenshot=${OUT_LOGO}`,
        `file:///${tmp.replace(/\\/g, '/')}`,
      ],
      { stdio: 'pipe' }
    );
    fs.copyFileSync(OUT_LOGO, PLUGIN_ICON);
    console.log('Generated browser icon:', OUT_LOGO);
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

main();
