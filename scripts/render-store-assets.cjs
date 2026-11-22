'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const STORE_DIR = path.join(ROOT, 'docs', 'store');
const ASSETS_DIR = path.join(STORE_DIR, 'assets');
const IMG_DIR = path.join(ROOT, 'src', 'common', 'images');
const FONT_PATH = 'C:\\Users\\liguo\\.gemini\\antigravity\\scratch\\cosmic-merge-band\\docs\\store\\fonts\\SmileySans-Oblique.ttf';

fs.mkdirSync(STORE_DIR, { recursive: true });

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

function toDataUri(filePath, mime) {
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

const FONT_URI = fs.existsSync(FONT_PATH) ? toDataUri(FONT_PATH, 'font/ttf') : '';
const LOGO_URI = toDataUri(path.join(ROOT, 'src', 'common', 'logo.png'), 'image/png');
const COVER_BG_URI = toDataUri(path.join(ASSETS_DIR, 'cover_quicksand_bg.jpg'), 'image/jpeg');
const PREVIEW_BG_URI = toDataUri(path.join(ASSETS_DIR, 'preview_quicksand_bg.jpg'), 'image/jpeg');
const ICONS = {
  back: toDataUri(path.join(IMG_DIR, 'back_rect.png'), 'image/png'),
  search: toDataUri(path.join(IMG_DIR, 'search_rect.png'), 'image/png'),
  more: toDataUri(path.join(IMG_DIR, 'more_rect.png'), 'image/png'),
  check: toDataUri(path.join(IMG_DIR, 'check_rect.png'), 'image/png'),
};

function renderWatchScreen(kind) {
  const header = (title, rightIcon) => `
    <div class="w-top">
      <img class="w-btn" src="${ICONS.back}" alt="" />
      <div class="w-title-col">
        <div class="w-clock">08:42</div>
        <div class="w-title">${title}</div>
      </div>
      <img class="w-btn" src="${rightIcon}" alt="" />
    </div>`;

  if (kind === 'home') {
    const sites = [
      ['W', '#0F2942', '#38BDF8', '维基百科', 'zh.wikipedia.org'],
      ['B', '#0D2F26', '#34D399', '必应搜索', 'cn.bing.com'],
      ['D', '#33240B', '#FBBF24', 'DDG 轻量', 'lite.duckduckgo.com'],
    ];
    return `
      <div class="w-screen">
        ${header('流沙浏览器', ICONS.search)}
        <div class="w-scroll">
          <div class="w-omni">
            <span>输入网址或搜索...</span>
            <div class="w-go">前往</div>
          </div>
          <div class="w-status">
            <div class="w-status-l"><span class="w-dot-live"></span><span>AstroBox 实时联网</span></div>
            <span class="w-chev">›</span>
          </div>
          <div class="w-sec">常用网站</div>
          ${sites.map(([ch, bg, fg, name, host]) => `
            <div class="w-card">
              <div class="w-badge" style="background:${bg};color:${fg};">${ch}</div>
              <div class="w-mid">
                <div class="w-ctitle">${name}</div>
                <div class="w-csub">${host}</div>
              </div>
              <span class="w-chev">›</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  if (kind === 'reader') {
    return `
      <div class="w-screen w-col">
        ${header('iot.mi.com', ICONS.more)}
        <div class="w-rscroll">
          <div class="w-urlbar">
            <span class="w-urltxt">https://iot.mi.com/vela/qu...</span>
            <span class="w-uchip">输入</span>
          </div>
          <div class="w-hero">
            <div class="w-meta"><span class="w-live-pill">实时阅读</span><span class="w-host">iot.mi.com</span></div>
            <div class="w-doctitle">Xiaomi Vela JS 应用</div>
          </div>
          <div class="w-art">
            <div class="w-hrow"><span class="w-hbar"></span><span>JS应用开发文档</span></div>
            <div class="w-p">开发者友好，性能高效的IoT跨端应用框架</div>
            <div class="w-hrow" style="margin-top:10px;"><span class="w-hbar"></span><span>开发者友好</span></div>
            <div class="w-p" style="font-size:16px;color:#9A9A9A;">支持前端开发语法，易于上手，极速开发</div>
          </div>
        </div>
        <div class="w-bnav">
          <div class="w-pbtn w-pdim">‹ 后退</div>
          <div class="w-pbtn w-pstar">收藏</div>
          <div class="w-pbtn w-pdim">前进 ›</div>
        </div>
      </div>`;
  }

  if (kind === 'links' || kind === 'links-full') {
    const links = [
      '科技爱好者周刊（第 420 期）：最分心的一年',
      '科技爱好者周刊（第 419 期）：机房来了，写字楼走了',
      '科技爱好者周刊（第 418 期）：如果科技停止在21世纪初',
    ];
    return `
      <div class="w-screen w-col">
        ${header('ruanyifeng...', ICONS.more)}
        <div class="w-rscroll">
          <div class="w-sec" style="margin-top:4px;">页面超链接（点击直达）</div>
          ${links.map((label) => `
            <div class="w-lcard">
              <div class="w-ltag">#</div>
              <div class="w-llabel">${label}</div>
              <span class="w-chev">›</span>
            </div>`).join('')}
        </div>
        ${kind === 'links-full' ? `
        <div class="w-bnav">
          <div class="w-pbtn">‹ 后退</div>
          <div class="w-pbtn w-pstar">收藏</div>
          <div class="w-pbtn w-pdim">前进 ›</div>
        </div>` : ''}
      </div>`;
  }

  return `
    <div class="w-screen w-col">
      ${header('输入网址', ICONS.check)}
      <div class="w-addrwrap">
        <div class="w-icard">
          <div class="w-ibox">iot.mi.com/vela/<span style="color:#0D84FF;">|</span></div>
          <div class="w-ebar">
            <div class="w-mbtn">‹ 左</div>
            <div class="w-mbtn">右 ›</div>
            <div class="w-mbtn w-eng">Bing</div>
            <div class="w-mbtn w-clr">清空</div>
          </div>
        </div>
        <div class="w-kbd">
          <div class="w-kbar">
            <span class="w-kp w-kp-act">ABC</span><span class="w-kp">中</span><span class="w-kp">符</span><span class="w-kp">词</span><span class="w-kp">123</span><span class="w-kp w-kp-del">删</span>
          </div>
          <div class="w-krow"><span>Q</span><span>W</span><span>E</span><span>R</span><span>T</span></div>
          <div class="w-krow w-krow-s"><span>A</span><span>S</span><span>D</span><span>F</span><span>G</span></div>
          <div class="w-krow"><span style="font-size:18px;">Aa</span><span>Z</span><span>X</span><span>C</span><span>V</span></div>
        </div>
      </div>
    </div>`;
}

const SHARED_CSS = `
  ${FONT_URI ? `@font-face { font-family: 'SmileySans'; src: url('${FONT_URI}') format('truetype'); }` : ''}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1200px; height: 800px; overflow: hidden;
    font-family: 'Microsoft YaHei UI', 'PingFang SC', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .canvas {
    position: relative; width: 1200px; height: 800px; overflow: hidden;
    background: #F4F7FB;
  }
  .photo-bg {
    position: absolute; inset: 0; width: 1200px; height: 800px; object-fit: cover; pointer-events: none;
  }

  /* Sculpted Brushed Titanium Band 9 Pro Hardware Mockup */
  .band { display: inline-flex; flex-direction: column; align-items: center; }
  .strap-t, .strap-b {
    width: 54%; height: 48px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), inset 0 -1px 0 rgba(148, 163, 184, 0.28);
  }
  .strap-t {
    border-radius: 22px 22px 0 0; margin-bottom: -14px;
    background: linear-gradient(180deg, rgba(226,232,240,0.42) 0%, #DCE4EF 48%, #B9C4D4 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 42%);
  }
  .strap-b {
    border-radius: 0 0 22px 22px; margin-top: -14px;
    background: linear-gradient(180deg, #B9C4D4 0%, #DCE4EF 52%, rgba(226,232,240,0.42) 100%);
    -webkit-mask-image: linear-gradient(to top, transparent 0%, black 42%);
  }
  .chassis {
    padding: 13px; border-radius: 38px;
    background: linear-gradient(145deg, #FFFFFF 0%, #DBE4EE 38%, #A2B0C4 78%, #CBD5E1 100%);
    box-shadow:
      0 36px 76px rgba(15, 23, 42, 0.19),
      0 10px 26px rgba(15, 23, 42, 0.08),
      inset 0 1.5px 2px rgba(255, 255, 255, 0.96),
      inset 0 -1.5px 3px rgba(100, 116, 139, 0.35);
  }
  .bezel {
    position: relative; padding: 5px; border-radius: 28px;
    background: linear-gradient(160deg, #1E2430 0%, #090B0F 100%);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  }
  .screen-wrap {
    position: relative; overflow: hidden; border-radius: 23px; background: #000000;
  }
  .screen-glare {
    position: absolute; inset: 0; border-radius: 23px; pointer-events: none;
    background: linear-gradient(128deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.02) 32%, transparent 48%);
  }
  .screen-slot {
    position: absolute; left: 0; top: 0;
    width: 336px; height: 480px; background: #000000; transform-origin: top left;
  }

  /* Pixel-faithful 336x480 Band Browser UI */
  .w-screen { width: 336px; height: 480px; background: #000000; color: #FFFFFF; position: relative; font-family: 'Microsoft YaHei UI', sans-serif; }
  .w-col { display: flex; flex-direction: column; }
  .w-top { position: relative; width: 336px; height: 84px; flex-shrink: 0; }
  .w-btn { position: absolute; top: 6px; width: 72px; height: 72px; }
  .w-btn:first-child { left: 6px; }
  .w-btn:last-child { right: 6px; }
  .w-title-col { position: absolute; left: 77px; top: 7px; width: 182px; text-align: center; }
  .w-clock { font-size: 22px; font-weight: 700; color: #9A9A9A; line-height: 28px; }
  .w-title { font-size: 28px; font-weight: 700; color: #FFFFFF; line-height: 36px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .w-scroll { padding: 2px 6px 0; display: flex; flex-direction: column; gap: 7px; }
  .w-omni {
    width: 324px; height: 58px; border-radius: 29px; background: #262626;
    display: flex; align-items: center; justify-content: space-between; padding: 0 10px 0 20px;
    font-size: 20px; font-weight: 700; color: #9A9A9A;
  }
  .w-go { background: #0D84FF; color: #FFFFFF; font-size: 17px; font-weight: 700; padding: 7px 16px; border-radius: 20px; }
  .w-status {
    width: 324px; height: 44px; border-radius: 22px; background: #191919;
    display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
    font-size: 17px; font-weight: 700; color: #D4D4D8;
  }
  .w-status-l { display: flex; align-items: center; gap: 10px; }
  .w-dot-live { width: 10px; height: 10px; border-radius: 5px; background: #4ADE80; display: inline-block; }
  .w-chev { font-size: 24px; font-weight: 700; color: #777777; }
  .w-sec { font-size: 19px; font-weight: 700; color: #9A9A9A; padding-left: 14px; margin-top: 2px; }
  .w-card {
    width: 324px; padding: 12px 16px; border-radius: 28px; background: #262626;
    display: flex; align-items: center;
  }
  .w-badge {
    width: 44px; height: 44px; border-radius: 22px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 19px; font-weight: 700; margin-right: 12px;
  }
  .w-mid { flex: 1; min-width: 0; }
  .w-ctitle { font-size: 23px; font-weight: 700; color: #FFFFFF; line-height: 28px; }
  .w-csub { font-size: 16px; color: #9A9A9A; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .w-rscroll { flex: 1; padding: 2px 6px 0; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
  .w-urlbar {
    width: 324px; height: 50px; border-radius: 25px; background: #262626;
    display: flex; align-items: center; justify-content: space-between; padding: 0 10px 0 18px;
  }
  .w-urltxt { font-size: 16px; font-weight: 700; color: #64B5F6; }
  .w-uchip { padding: 6px 14px; border-radius: 16px; background: #363636; font-size: 15px; font-weight: 700; }
  .w-hero { width: 324px; padding: 14px 18px; border-radius: 28px; background: #262626; }
  .w-meta { display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 700; margin-bottom: 6px; }
  .w-live-pill { padding: 3px 10px; border-radius: 10px; background: #163D34; color: #4ADE80; }
  .w-host { color: #9A9A9A; }
  .w-doctitle { font-size: 23px; font-weight: 700; color: #FFFFFF; }
  .w-art { width: 324px; padding: 14px 18px; border-radius: 28px; background: #191919; }
  .w-hrow { display: flex; align-items: center; font-size: 20px; font-weight: 700; color: #FFFFFF; margin-bottom: 8px; }
  .w-hbar { width: 4px; height: 20px; border-radius: 2px; background: #0D84FF; margin-right: 10px; display: inline-block; }
  .w-p { font-size: 18px; line-height: 27px; color: #D4D4D8; }
  .w-bnav { height: 60px; padding: 4px 10px 8px; display: flex; align-items: center; justify-content: space-between; }
  .w-pbtn {
    width: 98px; height: 46px; border-radius: 23px; background: #262626;
    display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 700; color: #FFFFFF;
  }
  .w-pdim { background: #161616; color: #555555; }
  .w-pstar { width: 106px; background: #1B365D; color: #64B5F6; }

  .w-lcard {
    width: 324px; padding: 13px 16px; border-radius: 26px; background: #262626;
    display: flex; align-items: center;
  }
  .w-ltag {
    width: 34px; height: 34px; border-radius: 17px; background: #1B365D; color: #64B5F6;
    display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; margin-right: 12px; flex-shrink: 0;
  }
  .w-llabel { flex: 1; min-width: 0; font-size: 17px; font-weight: 700; color: #FFFFFF; line-height: 23px; padding-right: 6px; }

  .w-addrwrap { padding: 0 6px; display: flex; flex-direction: column; gap: 6px; }
  .w-icard { width: 324px; padding: 10px 12px; border-radius: 26px; background: #262626; }
  .w-ibox { height: 44px; padding: 0 14px; border-radius: 18px; background: #161616; display: flex; align-items: center; font-size: 18px; font-weight: 700; color: #FFFFFF; }
  .w-ebar { margin-top: 8px; display: flex; justify-content: space-between; }
  .w-mbtn { width: 72px; height: 32px; border-radius: 16px; background: #363636; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; }
  .w-eng { background: #1B365D; color: #64B5F6; }
  .w-clr { background: #3F2226; color: #FF6B6B; }
  .w-kbd { width: 324px; padding: 6px 2px 0; display: flex; flex-direction: column; gap: 8px; }
  .w-kbar { display: flex; justify-content: space-between; }
  .w-kp { width: 49px; height: 49px; border-radius: 25px; background: #262626; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 700; color: #E5E7EB; }
  .w-kp-act { background: #6366F1; color: #FFFFFF; }
  .w-kp-del { background: #3F2226; color: #FDA4AF; }
  .w-krow { display: flex; justify-content: space-between; }
  .w-krow span { width: 58px; height: 58px; border-radius: 29px; background: #262626; display: flex; align-items: center; justify-content: center; font-size: 25px; font-weight: 700; color: #FFFFFF; }
  .w-krow-s { padding: 0 12px; }
`;

function bandMockup(kind, extraClass, wrapStyle, scaleClass) {
  return `
    <div class="band ${extraClass}">
      <div class="strap-t"></div>
      <div class="chassis">
        <div class="bezel">
          <div class="screen-wrap" style="${wrapStyle}">
            <div class="screen-slot ${scaleClass}">
              ${renderWatchScreen(kind)}
            </div>
            <div class="screen-glare"></div>
          </div>
        </div>
      </div>
      <div class="strap-b"></div>
    </div>`;
}

function buildCoverHtml() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    ${SHARED_CSS}
    /* Editorial Asymmetric Cover (Distinct from left-column+paired-watch template) */
    .head-block {
      position: absolute; left: 66px; top: 64px; z-index: 6; width: 610px;
    }
    .brand-row { display: flex; align-items: center; gap: 22px; }
    .icon-frame {
      width: 86px; height: 86px; border-radius: 24px;
      background: linear-gradient(145deg, #FFFFFF, #EDF2F8);
      border: 1.5px solid rgba(255, 255, 255, 0.96);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 16px 36px rgba(15, 23, 42, 0.11);
    }
    .logo { width: 68px; height: 68px; border-radius: 17px; }
    .title {
      font-family: 'SmileySans', 'Microsoft YaHei UI', sans-serif;
      font-size: 82px; line-height: 86px; color: #0B1526; letter-spacing: 2px;
      text-shadow: 0 2px 14px rgba(255, 255, 255, 0.85);
    }

    /* Translucent Liquid-Glass Browser Omnibox */
    .glass-omnibox {
      margin-top: 26px; width: 544px; height: 64px; border-radius: 32px;
      padding: 0 10px 0 22px;
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(22px);
      border: 1.5px solid rgba(255, 255, 255, 0.95);
      box-shadow:
        0 18px 42px rgba(15, 23, 42, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.98);
      display: flex; align-items: center; justify-content: space-between;
    }
    .omni-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .omni-dot { width: 11px; height: 11px; border-radius: 6px; background: #10B981; flex-shrink: 0; }
    .omni-url {
      font-size: 20px; font-weight: 700; color: #1E293B; letter-spacing: 0.1px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .omni-go {
      padding: 10px 24px; border-radius: 24px;
      background: linear-gradient(135deg, #0D84FF 0%, #2563EB 100%);
      color: #FFFFFF; font-size: 19px; font-weight: 700;
      box-shadow: 0 8px 20px rgba(13, 132, 255, 0.28);
    }
    .subline {
      margin-top: 18px; padding-left: 4px;
      font-size: 24px; font-weight: 700; color: #334155; letter-spacing: 0.4px;
    }

    /* Cascading Frosted Liquid-Glass Web Extraction Cards along the flowing sand dune */
    .float-card {
      position: absolute; z-index: 4;
      background: rgba(255, 255, 255, 0.64);
      backdrop-filter: blur(22px);
      border: 1.5px solid rgba(255, 255, 255, 0.94);
      border-radius: 26px; padding: 20px 24px;
      box-shadow:
        0 24px 52px rgba(15, 23, 42, 0.11),
        inset 0 1.5px 0 rgba(255, 255, 255, 0.98);
    }
    .fc-doc { left: 66px; top: 382px; width: 472px; transform: rotate(-1.6deg); }
    .fc-rss { left: 158px; top: 556px; width: 510px; transform: rotate(1.1deg); z-index: 5; }
    .fc-top {
      display: flex; align-items: center; justify-content: space-between;
      font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 10px;
    }
    .fc-tag {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 4px 12px; border-radius: 999px;
      background: rgba(13, 132, 255, 0.11); color: #0369A1;
    }
    .fc-tag-green { background: rgba(16, 185, 129, 0.12); color: #047857; }
    .fc-h { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 700; color: #0F172A; }
    .fc-bar { width: 5px; height: 24px; border-radius: 3px; background: #0D84FF; flex-shrink: 0; }
    .fc-p { margin-top: 7px; font-size: 19px; font-weight: 600; color: #475569; line-height: 28px; }
    .fc-link-row { display: flex; align-items: center; gap: 12px; }
    .fc-hash {
      width: 38px; height: 38px; border-radius: 19px; flex-shrink: 0;
      background: #0D84FF; color: #FFFFFF; font-size: 18px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .fc-link-txt { flex: 1; font-size: 20px; font-weight: 700; color: #0F172A; line-height: 27px; }
    .fc-link-sub { margin-top: 8px; padding-left: 50px; font-size: 16px; font-weight: 600; color: #64748B; }

    /* Single Sculpted Hero Titanium Band sweeping cleanly on the right crest */
    .hero-band-wrap {
      position: absolute; right: 78px; top: 56px; z-index: 6;
      transform: rotate(-4deg);
    }
    .scale-hero { transform: scale(0.95); }
  </style></head><body>
    <div class="canvas">
      <img class="photo-bg" src="${COVER_BG_URI}" alt="" />

      <div class="head-block">
        <div class="brand-row">
          <div class="icon-frame"><img class="logo" src="${LOGO_URI}" alt="" /></div>
          <div class="title">流沙浏览器</div>
        </div>
        <div class="glass-omnibox">
          <div class="omni-left">
            <span class="omni-dot"></span>
            <span class="omni-url">https://iot.mi.com/vela/quickapp/zh/</span>
          </div>
          <div class="omni-go">浏览</div>
        </div>
        <div class="subline">腕上实时网页正文阅读 · 超链接逐层直达</div>
      </div>

      <div class="float-card fc-doc">
        <div class="fc-top">
          <span class="fc-tag fc-tag-green">正文抽取 · 实时快照</span>
          <span>iot.mi.com</span>
        </div>
        <div class="fc-h"><span class="fc-bar"></span><span>JS应用开发文档</span></div>
        <div class="fc-p">开发者友好，性能高效的IoT跨端应用框架</div>
      </div>

      <div class="float-card fc-rss">
        <div class="fc-top">
          <span class="fc-tag">Atom / RSS 超链接直达</span>
          <span>ruanyifeng.com ›</span>
        </div>
        <div class="fc-link-row">
          <span class="fc-hash">#</span>
          <span class="fc-link-txt">科技爱好者周刊（第 420 期）：最分心的一年</span>
        </div>
        <div class="fc-link-sub">科技爱好者周刊（第 419 期）：机房来了，写字楼走了</div>
      </div>

      <div class="hero-band-wrap">
        ${bandMockup('reader', '', 'width:319px;height:456px;', 'scale-hero')}
      </div>
    </div>
  </body></html>`;
}

function buildPreviewHtml() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    ${SHARED_CSS}
    /* Asymmetric Editorial Bento Architecture over Liquid Mercury-Sand waves */
    .bento-shell {
      position: relative; z-index: 4; width: 1200px; height: 800px;
      padding: 40px 44px; display: flex; gap: 20px;
    }
    .bento-card {
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(22px);
      border: 1.5px solid rgba(255, 255, 255, 0.94);
      border-radius: 34px;
      box-shadow:
        0 20px 50px rgba(15, 23, 42, 0.08),
        inset 0 1.5px 0 rgba(255, 255, 255, 0.98);
      overflow: hidden;
      position: relative;
    }

    /* Left Tall Hero Reader Bento */
    .b-left {
      flex: none; width: 418px; height: 720px; padding: 24px 26px 20px;
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    }
    .bl-head { width: 100%; display: flex; align-items: center; gap: 14px; }
    .bl-icon-box {
      width: 50px; height: 50px; border-radius: 15px; flex-shrink: 0;
      background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.06);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
    }
    .bl-logo { width: 40px; height: 40px; border-radius: 10px; }
    .bl-title {
      font-family: 'SmileySans', 'Microsoft YaHei UI', sans-serif;
      font-size: 35px; line-height: 38px; color: #0B1526; white-space: nowrap;
    }
    .bl-sub { margin-top: 3px; font-size: 14.5px; font-weight: 600; color: #475569; white-space: nowrap; }
    .bl-watch { margin: 0; }
    .bl-watch .strap-t, .bl-watch .strap-b { height: 32px; }
    .bl-watch .chassis { padding: 11px; border-radius: 34px; }
    .bl-watch .bezel { padding: 4px; border-radius: 25px; }
    .scale-bleft { transform: scale(0.84); }
    .bl-foot {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .bl-pill {
      padding: 6px 12px; border-radius: 999px; white-space: nowrap;
      background: rgba(255, 255, 255, 0.86); border: 1px solid rgba(255, 255, 255, 0.96);
      font-size: 13.5px; font-weight: 700; color: #1E293B;
      box-shadow: 0 4px 10px rgba(15, 23, 42, 0.05);
    }
    .bl-pill-blue { color: #0D84FF; }

    /* Right Two-Tier Bento Column */
    .b-right { flex: 1; min-width: 0; height: 720px; display: flex; flex-direction: column; gap: 20px; }

    /* Top Wide Bento Card */
    .b-topwide {
      width: 100%; height: 330px; padding: 28px 30px;
      display: flex; align-items: flex-start; justify-content: space-between;
    }
    .btw-copy { width: 296px; flex-shrink: 0; padding-top: 4px; }
    .eyebrow {
      display: inline-block; padding: 4px 12px; border-radius: 999px;
      background: rgba(13, 132, 255, 0.10); color: #0369A1;
      font-size: 13px; font-weight: 800; letter-spacing: 0.4px;
    }
    .card-h {
      margin-top: 12px;
      font-family: 'SmileySans', 'Microsoft YaHei UI', sans-serif;
      font-size: 36px; line-height: 40px; color: #0B1526;
    }
    .card-p { margin-top: 8px; font-size: 16px; font-weight: 600; color: #475569; line-height: 24px; }
    .chip-grid {
      margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    }
    .site-chip {
      padding: 9px 12px; border-radius: 16px;
      background: rgba(255, 255, 255, 0.85); border: 1px solid rgba(255, 255, 255, 0.96);
      font-size: 15px; font-weight: 700; color: #0F172A;
      display: flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
    .sc-dot { width: 9px; height: 9px; border-radius: 5px; display: inline-block; }

    /* Peeking Cropped Home Band on Top Right */
    .btw-watch {
      position: relative; width: 312px; height: 306px; flex-shrink: 0;
      display: flex; justify-content: center;
    }
    .btw-band-pos { position: absolute; top: 0px; transform: rotate(2.5deg); }
    .btw-band-pos .strap-t { height: 24px; }
    .btw-band-pos .chassis { padding: 10px; border-radius: 30px; }
    .scale-topw { transform: scale(0.82); }

    /* Bottom Two-Card Row */
    .b-botrow { flex: 1; min-width: 0; display: flex; gap: 20px; }
    .b-sub {
      flex: 1; min-width: 0; padding: 24px 24px 0;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    .b-sub .card-h { margin-top: 0; font-size: 31px; line-height: 35px; }
    .b-sub .card-p { margin-top: 6px; font-size: 15px; line-height: 22px; }

    /* Framed Tactile Band Viewport Inset for Bottom Cards */
    .oled-inset {
      width: 100%; height: 248px; border-radius: 26px 26px 0 0;
      padding: 9px 9px 0;
      background: linear-gradient(155deg, #F8FAFC 0%, #CBD5E1 100%);
      box-shadow:
        0 18px 36px rgba(15, 23, 42, 0.14),
        inset 0 1.5px 2px rgba(255, 255, 255, 0.96);
      overflow: hidden;
    }
    .oled-bezel {
      width: 100%; height: 100%; border-radius: 19px 19px 0 0;
      padding: 4px 4px 0; background: #0B0E14; overflow: hidden;
    }
    .oled-screen {
      width: 100%; height: 100%; border-radius: 15px 15px 0 0;
      background: #000000; overflow: hidden; position: relative;
    }
    .scale-sub-crop {
      position: absolute; left: 0; top: 0;
      width: 336px; height: 480px;
      transform: scale(0.744); transform-origin: top left;
    }
    .kbd-zoom {
      transform: scale(0.744) translateY(-4px); transform-origin: top left;
    }
  </style></head><body>
    <div class="canvas">
      <img class="photo-bg" src="${PREVIEW_BG_URI}" alt="" />

      <div class="bento-shell">
        <div class="bento-card b-left">
          <div class="bl-head">
            <div class="bl-icon-box"><img class="bl-logo" src="${LOGO_URI}" alt="" /></div>
            <div>
              <div class="bl-title">流沙浏览器</div>
              <div class="bl-sub">剥离脚本广告 · 正文与链接重排</div>
            </div>
          </div>
          <div class="bl-watch">
            ${bandMockup('reader', '', 'width:282px;height:403px;', 'scale-bleft')}
          </div>
          <div class="bl-foot">
            <span class="bl-pill bl-pill-blue">Band 9 Pro</span>
            <span class="bl-pill">实时阅读</span>
            <span class="bl-pill">前进后退</span>
          </div>
        </div>

        <div class="b-right">
          <div class="bento-card b-topwide">
            <div class="btw-copy">
              <span class="eyebrow">OMNIBOX & SHORTCUTS</span>
              <div class="card-h">网址直达与搜索</div>
              <div class="card-p">顶部输入域名或关键词直达网页，内置高频常用站点一键访问。</div>
              <div class="chip-grid">
                <div class="site-chip"><span class="sc-dot" style="background:#38BDF8;"></span>维基百科</div>
                <div class="site-chip"><span class="sc-dot" style="background:#34D399;"></span>必应搜索</div>
                <div class="site-chip"><span class="sc-dot" style="background:#FBBF24;"></span>DDG 轻量</div>
                <div class="site-chip"><span class="sc-dot" style="background:#F472B6;"></span>Vela 文档</div>
              </div>
            </div>
            <div class="btw-watch">
              <div class="btw-band-pos">
                ${bandMockup('home', '', 'width:275px;height:393px;', 'scale-topw')}
              </div>
            </div>
          </div>

          <div class="b-botrow">
            <div class="bento-card b-sub">
              <div>
                <div class="card-h">HTML / Atom 超链接</div>
                <div class="card-p">自动提取文章链接列表，点击直达下一页</div>
              </div>
              <div class="oled-inset">
                <div class="oled-bezel">
                  <div class="oled-screen">
                    <div class="scale-sub-crop">${renderWatchScreen('links')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bento-card b-sub">
              <div>
                <div class="card-h">腕上全拼输入法</div>
                <div class="card-p">内置全拼 / 符号 / 光标键盘，独立输入网址</div>
              </div>
              <div class="oled-inset">
                <div class="oled-bezel">
                  <div class="oled-screen">
                    <div class="scale-sub-crop kbd-zoom">${renderWatchScreen('address')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body></html>`;
}

function buildPreview2Html() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    ${SHARED_CSS}
    .bg-mirror { transform: scaleX(-1); }
    .p2-shell {
      position: relative; z-index: 4; width: 1200px; height: 800px;
      padding: 48px 56px; display: flex; align-items: center; justify-content: space-between; gap: 44px;
    }
    .p2-left { flex: 1; display: flex; flex-direction: column; gap: 22px; }
    .p2-brand { display: flex; align-items: center; gap: 12px; }
    .p2-logo { width: 42px; height: 42px; border-radius: 10px; box-shadow: 0 6px 14px rgba(15,23,42,0.12); }
    .p2-tag {
      padding: 5px 14px; border-radius: 999px;
      background: rgba(13, 132, 255, 0.11); color: #0369A1;
      font-size: 14px; font-weight: 800; letter-spacing: 0.4px;
    }
    .p2-title {
      font-family: 'SmileySans', 'Microsoft YaHei UI', sans-serif;
      font-size: 56px; line-height: 60px; color: #0B1526;
    }
    .p2-sub { font-size: 19px; font-weight: 600; color: #475569; line-height: 29px; }

    .p2-card {
      background: rgba(255, 255, 255, 0.74);
      backdrop-filter: blur(22px);
      border: 1.5px solid rgba(255, 255, 255, 0.95);
      border-radius: 28px; padding: 22px 26px;
      box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08), inset 0 1.5px 0 rgba(255, 255, 255, 0.98);
    }
    .p2-ch { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .p2-ctitle { font-size: 21px; font-weight: 800; color: #0F172A; }
    .p2-badge {
      padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700;
      background: rgba(16, 185, 129, 0.14); color: #047857;
    }
    .p2-cdesc { font-size: 16px; font-weight: 600; color: #475569; line-height: 25px; }

    /* Tactile replica of bottom reader dock + URL bar inside Glass Card B */
    .p2-dock {
      margin-top: 14px; padding: 10px 14px; border-radius: 22px; background: #0B0E14;
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
    }
    .p2-dbtn {
      flex: 1; height: 40px; border-radius: 20px; background: #262626;
      color: #FFFFFF; font-size: 15px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .p2-dstar { background: #1B365D; color: #64B5F6; }

    .p2-right {
      flex: none; width: 450px; height: 704px;
      background: rgba(255, 255, 255, 0.56);
      backdrop-filter: blur(22px);
      border: 1.5px solid rgba(255, 255, 255, 0.94);
      border-radius: 38px;
      box-shadow: 0 24px 56px rgba(15, 23, 42, 0.09);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .p2-right .strap-t, .p2-right .strap-b { height: 38px; }
    .scale-p2 { transform: scale(1.0); }
  </style></head><body>
    <div class="canvas">
      <img class="photo-bg bg-mirror" src="${PREVIEW_BG_URI}" alt="" />

      <div class="p2-shell">
        <div class="p2-left">
          <div>
            <div class="p2-brand">
              <img class="p2-logo" src="${LOGO_URI}" alt="" />
              <span class="p2-tag">READER MODE & OFFLINE CACHE</span>
            </div>
            <div class="p2-title" style="margin-top:14px;">无源流沙沉浸阅读</div>
            <div class="p2-sub" style="margin-top:8px;">通过 AstroBox V2 WASM 插件在后台智能剥离网页导航栏与冗余脚本，在手环端只保留标题、段落与可点击链接。</div>
          </div>

          <div class="p2-card">
            <div class="p2-ch">
              <span class="p2-ctitle">实时分段加载与 UTF-8 排版</span>
              <span class="p2-badge">iot.mi.com 实测画面</span>
            </div>
            <div class="p2-cdesc">自动识别长文分页点，阅读到底部可一键续载下一段；纯黑 AMOLED 底色搭配无源流沙大字卡片，在户外强光与夜间同样清晰省电。</div>
          </div>

          <div class="p2-card">
            <div class="p2-ch">
              <span class="p2-ctitle">历史栈前后跳转 · 一键离线收藏</span>
              <span class="p2-badge" style="background:rgba(13,132,255,0.12);color:#0369A1;">无网仍可读</span>
            </div>
            <div class="p2-cdesc">内置完整浏览历史栈，点按底部胶囊即可在多级网页间自由切换，或永久缓存正文至手环本地书签。</div>
            <div class="p2-dock">
              <div class="p2-dbtn">‹ 后退</div>
              <div class="p2-dbtn p2-dstar">收藏本地</div>
              <div class="p2-dbtn">前进 ›</div>
            </div>
          </div>
        </div>

        <div class="p2-right">
          ${bandMockup('reader', '', 'width:336px;height:480px;', 'scale-p2')}
        </div>
      </div>
    </div>
  </body></html>`;
}

function buildPreview3Html() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    ${SHARED_CSS}
    .p3-bg { transform: scaleX(-1); opacity: 0.78; }
    .p3-shell {
      position: relative; z-index: 4; width: 1200px; height: 800px;
      padding: 36px 46px 40px; display: flex; flex-direction: column; gap: 22px;
    }
    .p3-top {
      height: 76px; padding: 0 26px; border-radius: 26px;
      background: rgba(255, 255, 255, 0.76); backdrop-filter: blur(22px);
      border: 1.5px solid rgba(255, 255, 255, 0.95);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
      display: flex; align-items: center; justify-content: space-between;
    }
    .p3-tl { display: flex; align-items: center; gap: 14px; }
    .p3-logo { width: 42px; height: 42px; border-radius: 10px; }
    .p3-h {
      font-family: 'SmileySans', 'Microsoft YaHei UI', sans-serif;
      font-size: 36px; color: #0B1526;
    }
    .p3-pill {
      padding: 8px 18px; border-radius: 999px;
      background: rgba(13, 132, 255, 0.11); color: #0369A1;
      font-size: 16px; font-weight: 700;
    }

    .p3-grid { flex: 1; min-height: 0; display: flex; gap: 24px; }
    .p3-stage {
      flex: 1; min-width: 0; border-radius: 34px; padding: 26px 28px;
      background: rgba(255, 255, 255, 0.74); backdrop-filter: blur(22px);
      border: 1.5px solid rgba(255, 255, 255, 0.95);
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
      display: flex; align-items: center; justify-content: space-between; gap: 20px;
    }
    .p3-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px; }
    .p3-eyebrow {
      align-self: flex-start; padding: 4px 12px; border-radius: 999px;
      background: rgba(16, 185, 129, 0.14); color: #047857;
      font-size: 13px; font-weight: 800;
    }
    .p3-sh {
      font-family: 'SmileySans', 'Microsoft YaHei UI', sans-serif;
      font-size: 38px; line-height: 42px; color: #0B1526;
    }
    .p3-sp { font-size: 16px; font-weight: 600; color: #475569; line-height: 25px; }
    .p3-list { display: flex; flex-direction: column; gap: 9px; margin-top: 4px; }
    .p3-li {
      padding: 9px 14px; border-radius: 16px;
      background: rgba(255, 255, 255, 0.88); border: 1px solid rgba(255, 255, 255, 0.98);
      font-size: 15px; font-weight: 700; color: #0F172A;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }

    .p3-watch { flex: none; }
    .p3-watch .strap-t, .p3-watch .strap-b { height: 28px; }
    .p3-watch .chassis { padding: 11px; border-radius: 34px; }
    .p3-watch .bezel { padding: 4px; border-radius: 25px; }
    .scale-p3 { transform: scale(0.86); }
  </style></head><body>
    <div class="canvas">
      <img class="photo-bg p3-bg" src="${COVER_BG_URI}" alt="" />

      <div class="p3-shell">
        <div class="p3-top">
          <div class="p3-tl">
            <img class="p3-logo" src="${LOGO_URI}" alt="" />
            <div class="p3-h">流沙浏览器 · 逐层跳转与独立输入</div>
          </div>
          <div class="p3-pill">AstroBox V2 WASM 插件直连 · 免开电脑</div>
        </div>

        <div class="p3-grid">
          <div class="p3-stage">
            <div class="p3-copy">
              <span class="p3-eyebrow">HYPERLINKS & RSS / ATOM</span>
              <div class="p3-sh">超链接<br/>逐层阅读</div>
              <div class="p3-sp">自动识别正文与 Atom/RSS 中的有效链接，在手腕点开下一页。</div>
              <div class="p3-list">
                <div class="p3-li">✓ 过滤页头页脚杂讯</div>
                <div class="p3-li">✓ 实测兼容 阮一峰周刊</div>
                <div class="p3-li">✓ 点击链接直接跳下一页</div>
              </div>
            </div>
            <div class="p3-watch">
              ${bandMockup('links-full', '', 'width:289px;height:413px;', 'scale-p3')}
            </div>
          </div>

          <div class="p3-stage">
            <div class="p3-copy">
              <span class="p3-eyebrow" style="background:rgba(13,132,255,0.12);color:#0369A1;">WRIST KEYBOARD & SEARCH</span>
              <div class="p3-sh">腕上输入<br/>与轻搜索</div>
              <div class="p3-sp">内置全键盘与符号切换，支持光标微调，脱离手机独立上网。</div>
              <div class="p3-list">
                <div class="p3-li">✓ 域名补全 https://</div>
                <div class="p3-li">✓ 切 Bing / DDG 搜索</div>
                <div class="p3-li">✓ 高对比适配 336×480</div>
              </div>
            </div>
            <div class="p3-watch">
              ${bandMockup('address', '', 'width:289px;height:413px;', 'scale-p3')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </body></html>`;
}

function renderHtml(browser, html, outPng) {
  const tmp = path.join(os.tmpdir(), `bb-store-${Date.now()}-${Math.random().toString(16).slice(2)}.html`);
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
        '--window-size=1200,800',
        `--screenshot=${outPng}`,
        `file:///${tmp.replace(/\\/g, '/')}`,
      ],
      { stdio: 'pipe' }
    );
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

function main() {
  const browser = findBrowser();
  renderHtml(browser, buildCoverHtml(), path.join(STORE_DIR, 'astrobox_cover.png'));
  const preview1Path = path.join(STORE_DIR, 'astrobox_preview_1.png');
  renderHtml(browser, buildPreviewHtml(), preview1Path);
  fs.copyFileSync(preview1Path, path.join(STORE_DIR, 'astrobox_preview.png'));
  renderHtml(browser, buildPreview2Html(), path.join(STORE_DIR, 'astrobox_preview_2.png'));
  renderHtml(browser, buildPreview3Html(), path.join(STORE_DIR, 'astrobox_preview_3.png'));
  console.log('Rendered bespoke cover & 3 preview slides (1200x800)');
}

main();
