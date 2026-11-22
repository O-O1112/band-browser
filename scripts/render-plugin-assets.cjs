'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PLUGIN_STORE_DIR = path.join(ROOT, 'docs', 'store', 'plugin');
const ASSETS_DIR = path.join(ROOT, 'docs', 'store', 'assets');
const FONT_PATH = 'C:\\Users\\liguo\\.gemini\\antigravity\\scratch\\cosmic-merge-band\\docs\\store\\fonts\\SmileySans-Oblique.ttf';

fs.mkdirSync(PLUGIN_STORE_DIR, { recursive: true });

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
const PLUGIN_ICON_URI = toDataUri(path.join(ROOT, 'astrobox-plugin', 'icon.png'), 'image/png');
const APP_ICON_URI = toDataUri(path.join(ROOT, 'src', 'common', 'logo.png'), 'image/png');
const COVER_BG_URI = toDataUri(path.join(ASSETS_DIR, 'cover_quicksand_bg.jpg'), 'image/jpeg');
const PREVIEW_BG_URI = toDataUri(path.join(ASSETS_DIR, 'preview_quicksand_bg.jpg'), 'image/jpeg');

const BASE_CSS = `
  ${FONT_URI ? `@font-face { font-family: 'SmileySans'; src: url('${FONT_URI}') format('truetype'); }` : ''}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1200px; height: 800px; overflow: hidden;
    font-family: 'Microsoft YaHei UI', 'PingFang SC', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .canvas { position: relative; width: 1200px; height: 800px; overflow: hidden; background: #F4F7FB; }
  .bg { position: absolute; inset: 0; width: 1200px; height: 800px; object-fit: cover; pointer-events: none; }
  .glass {
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(22px);
    border: 1.5px solid rgba(255, 255, 255, 0.95);
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08), inset 0 1.5px 0 rgba(255, 255, 255, 0.98);
  }
  .display { font-family: 'SmileySans', 'Microsoft YaHei UI', sans-serif; color: #0B1526; }
`;

function buildCoverHtml() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    ${BASE_CSS}
    .head { position: absolute; left: 66px; top: 64px; z-index: 6; width: 1068px; }
    .brand { display: flex; align-items: center; gap: 22px; }
    .icon { width: 84px; height: 84px; border-radius: 22px; box-shadow: 0 14px 32px rgba(13, 132, 255, 0.22); }
    .title { font-size: 72px; line-height: 78px; letter-spacing: 1px; white-space: nowrap; }
    .pill {
      margin-top: 22px; display: inline-flex; align-items: center; gap: 12px;
      padding: 12px 24px; border-radius: 999px;
      background: rgba(255, 255, 255, 0.82); backdrop-filter: blur(20px);
      border: 1.5px solid rgba(255, 255, 255, 0.96);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
      font-size: 20px; font-weight: 700; color: #0369A1;
    }
    .p-dot { width: 10px; height: 10px; border-radius: 5px; background: #10B981; }
    .sub { margin-top: 18px; font-size: 24px; font-weight: 700; color: #334155; }

    /* Three-stage Liquid-Glass Relay Pipeline across bottom-left to right */
    .flow {
      position: absolute; left: 66px; right: 66px; bottom: 64px; z-index: 5;
      display: flex; align-items: stretch; gap: 20px;
    }
    .node {
      flex: 1; border-radius: 28px; padding: 24px 24px;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    .node-main {
      background: rgba(255, 255, 255, 0.80);
      border: 1.5px solid rgba(255, 255, 255, 0.98);
      box-shadow: 0 26px 58px rgba(13, 132, 255, 0.14);
    }
    .n-badge {
      align-self: flex-start; padding: 5px 13px; border-radius: 999px;
      font-size: 13px; font-weight: 800; background: rgba(13, 132, 255, 0.12); color: #0369A1;
    }
    .n-badge-g { background: rgba(16, 185, 129, 0.14); color: #047857; }
    .n-h { margin-top: 12px; font-size: 26px; font-weight: 800; color: #0F172A; }
    .n-p { margin-top: 6px; font-size: 16px; font-weight: 600; color: #475569; line-height: 24px; }
    .n-code {
      margin-top: 14px; padding: 11px 14px; border-radius: 16px;
      background: #0F172A; color: #E2E8F0; font-size: 13.5px; font-weight: 700;
      font-family: Consolas, 'Microsoft YaHei UI', monospace;
      white-space: nowrap; text-align: center;
    }
    .arrow-col {
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; font-weight: 800; color: #0D84FF;
    }
  </style></head><body>
    <div class="canvas">
      <img class="bg" src="${COVER_BG_URI}" alt="" />

      <div class="head">
        <div class="brand">
          <img class="icon" src="${PLUGIN_ICON_URI}" alt="" />
          <div class="display title">流沙浏览器同步插件</div>
        </div>
        <div class="pill"><span class="p-dot"></span><span>AstroBox V2 · WASI HTTP × Interconnect 直连</span></div>
        <div class="sub">免开电脑代理服务 · 自动清洗正文与链接送达手环</div>
      </div>

      <div class="flow">
        <div class="glass node">
          <div>
            <span class="n-badge">1. WASI HTTP 直取</span>
            <div class="n-h">直连任意网页与订阅</div>
            <div class="n-p">直接发起 HTTPS 请求并处理重定向，不依赖本地 PC 转发服务。</div>
          </div>
          <div class="n-code">iot.mi.com · ruanyifeng.com</div>
        </div>

        <div class="arrow-col">→</div>

        <div class="glass node node-main">
          <div>
            <span class="n-badge n-badge-g">2. Rust WASM 内核清洗</span>
            <div class="n-h">正文重排与超链接抽取</div>
            <div class="n-p">自动剔除脚本与页脚导航，兼容 HTML 与 Atom / RSS，并支持 UTF-8 分页。</div>
          </div>
          <div class="n-code" style="background:#0D84FF;color:#FFFFFF;">wasm32-wasip2 · band_browser_sync</div>
        </div>

        <div class="arrow-col">→</div>

        <div class="glass node">
          <div>
            <span class="n-badge">3. Interconnect 送达</span>
            <div class="n-h">同步至流沙浏览器</div>
            <div class="n-p">通过 AstroBox 通道自动传回小米手环 9 Pro 实时阅读。</div>
          </div>
          <div class="n-code">io.github.o_o1112.bandbrowser</div>
        </div>
      </div>
    </div>
  </body></html>`;
}

function buildPreview1Html() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    ${BASE_CSS}
    .shell { position: relative; z-index: 4; padding: 42px 48px; height: 800px; display: flex; flex-direction: column; gap: 24px; }
    .top {
      height: 82px; padding: 0 28px; border-radius: 26px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .tl { display: flex; align-items: center; gap: 16px; }
    .logo { width: 46px; height: 46px; border-radius: 11px; }
    .th { font-size: 38px; }
    .tp { padding: 8px 18px; border-radius: 999px; background: rgba(13,132,255,0.12); color: #0369A1; font-size: 16px; font-weight: 700; }

    .grid { flex: 1; display: flex; gap: 24px; }
    .col { flex: 1; border-radius: 32px; padding: 34px 32px; display: flex; flex-direction: column; justify-content: center; gap: 32px; }
    .eyebrow { align-self: flex-start; padding: 5px 14px; border-radius: 999px; font-size: 13px; font-weight: 800; }
    .eb-dim { background: rgba(100,116,139,0.14); color: #475569; }
    .eb-blue { background: rgba(16,185,129,0.14); color: #047857; }
    .ch { margin-top: 14px; font-size: 40px; line-height: 44px; }
    .cp { margin-top: 10px; font-size: 17px; font-weight: 600; color: #475569; line-height: 27px; }
    .box-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    .item {
      padding: 15px 18px; border-radius: 20px; background: rgba(255,255,255,0.86);
      border: 1px solid rgba(255,255,255,0.98); font-size: 16px; font-weight: 700; color: #0F172A;
      display: flex; align-items: center; justify-content: space-between;
    }
    .tag-ok { color: #059669; font-size: 14px; }
    .tag-old { color: #94A3B8; font-size: 14px; }
  </style></head><body>
    <div class="canvas">
      <img class="bg" src="${PREVIEW_BG_URI}" alt="" />
      <div class="shell">
        <div class="glass top">
          <div class="tl">
            <img class="logo" src="${PLUGIN_ICON_URI}" alt="" />
            <div class="display th">架构对比 · 告别繁琐电脑后端</div>
          </div>
          <div class="tp">AstroBox API Level 3 · WASI v2</div>
        </div>
        <div class="grid">
          <div class="glass col" style="opacity:0.9;">
            <div>
              <span class="eyebrow eb-dim">传统方案痛点</span>
              <div class="display ch">依赖电脑端脚本转发</div>
              <div class="cp">过去在手环上浏览网页往往需要用户自己在电脑打开 Python / Node HTTP 中转服务器，离开电脑就立刻断网。</div>
            </div>
            <div class="box-list">
              <div class="item"><span>需在电脑开启常驻终端进程</span><span class="tag-old">步骤繁琐</span></div>
              <div class="item"><span>需绑定局域网 IP / 防火墙端口</span><span class="tag-old">出门失效</span></div>
              <div class="item"><span>纯客户端难以清洗重脚本网页</span><span class="tag-old">加载易卡顿</span></div>
            </div>
          </div>

          <div class="glass col" style="background:rgba(255,255,255,0.82);border-color:#FFFFFF;">
            <div>
              <span class="eyebrow eb-blue">本插件方案</span>
              <div class="display ch">手机 AstroBox 原生托管</div>
              <div class="cp">利用 Rust 编译为轻量级 WASI WASM 模块，直接在 AstroBox 内完成网络抓取与正文排版，随时随地掏出手机就能上网。</div>
            </div>
            <div class="box-list">
              <div class="item"><span>waki WASI HTTP 自动跟进重定向</span><span class="tag-ok">✓ 零本地服务</span></div>
              <div class="item"><span>自动带 Accept-Encoding: identity</span><span class="tag-ok">✓ 防压缩乱码</span></div>
              <div class="item"><span>主动 register_interconnect_recv 唤醒</span><span class="tag-ok">✓ 毫秒响应</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body></html>`;
}

function buildPreview2Html() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    ${BASE_CSS}
    .shell { position: relative; z-index: 4; padding: 42px 48px; height: 800px; display: flex; flex-direction: column; gap: 24px; }
    .top {
      height: 82px; padding: 0 28px; border-radius: 26px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .tl { display: flex; align-items: center; gap: 16px; }
    .logo { width: 46px; height: 46px; border-radius: 11px; }
    .th { font-size: 38px; }
    .tp { padding: 8px 18px; border-radius: 999px; background: rgba(16,185,129,0.14); color: #047857; font-size: 16px; font-weight: 700; }

    .stage { flex: 1; display: flex; align-items: stretch; gap: 18px; }
    .pane { flex: 1; border-radius: 32px; padding: 26px; display: flex; flex-direction: column; gap: 14px; }
    .ph { font-size: 28px; }
    .codebox {
      flex: 1; border-radius: 22px; background: #0B1526; color: #94A3B8; padding: 18px;
      font-family: Consolas, monospace; font-size: 14px; line-height: 23px; overflow: hidden;
    }
    .strike { color: #F87171; text-decoration: line-through; }
    .keep { color: #4ADE80; font-weight: 700; }
    .mid {
      width: 196px; flex: none; border-radius: 28px; padding: 22px 16px;
      display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 14px;
    }
    .mid-ico { width: 64px; height: 64px; border-radius: 18px; box-shadow: 0 10px 24px rgba(13,132,255,0.2); }
    .mid-h { font-size: 26px; line-height: 30px; }
    .mid-tag { padding: 5px 12px; border-radius: 999px; background: #0D84FF; color: #FFFFFF; font-size: 13px; font-weight: 700; }

    .out-card {
      padding: 14px 16px; border-radius: 18px; background: #16181D; color: #FFFFFF;
    }
    .out-h { font-size: 18px; font-weight: 700; color: #60A5FA; margin-bottom: 6px; }
    .out-p { font-size: 15px; color: #CBD5E1; line-height: 22px; }
    .out-link {
      margin-top: 8px; padding: 8px 12px; border-radius: 12px; background: #1E293B;
      color: #4ADE80; font-size: 14px; font-weight: 700;
    }
  </style></head><body>
    <div class="canvas">
      <img class="bg" style="transform:scaleX(-1);" src="${PREVIEW_BG_URI}" alt="" />
      <div class="shell">
        <div class="glass top">
          <div class="tl">
            <img class="logo" src="${PLUGIN_ICON_URI}" alt="" />
            <div class="display th">无依赖 HTML / RSS 智能清洗引擎</div>
          </div>
          <div class="tp">html_reader.rs · 6/6 单元测试通过</div>
        </div>

        <div class="stage">
          <div class="glass pane">
            <div class="display ph">原始网页 / Atom XML</div>
            <div class="codebox">
              <div>&lt;head&gt;<span class="strike">&lt;script&gt;analytics()...&lt;/script&gt;</span>&lt;/head&gt;</div>
              <div><span class="strike">&lt;nav&gt;首页 | 登录 | 广告推广...&lt;/nav&gt;</span></div>
              <div class="keep">&lt;h1&gt;JS应用开发文档&lt;/h1&gt;</div>
              <div class="keep">&lt;p&gt;开发者友好，性能高效的IoT跨端应用框架&lt;/p&gt;</div>
              <div>&lt;entry&gt;</div>
              <div class="keep">&nbsp;&nbsp;&lt;title&gt;科技爱好者周刊（第 420 期）&lt;/title&gt;</div>
              <div class="keep">&nbsp;&nbsp;&lt;link href=".../issue-420.html"/&gt;</div>
              <div>&lt;/entry&gt;</div>
              <div><span class="strike">&lt;footer&gt;© 备案与页脚杂讯&lt;/footer&gt;</span></div>
            </div>
          </div>

          <div class="glass mid">
            <img class="mid-ico" src="${PLUGIN_ICON_URI}" alt="" />
            <div class="display mid-h">Rust 内核<br/>实时净化</div>
            <span class="mid-tag">UTF-8 分页</span>
            <div style="font-size:14px;font-weight:700;color:#475569;line-height:21px;">过滤样式与导航<br/>按手环内存切片</div>
          </div>

          <div class="glass pane" style="background:rgba(255,255,255,0.82);">
            <div class="display ph">手环收到紧凑 JSON</div>
            <div class="out-card">
              <div class="out-h">iot.mi.com/vela/quickapp/zh/</div>
              <div class="out-p">【标题】Xiaomi Vela JS 应用<br/>【正文】开发者友好，性能高效的IoT跨端应用框架</div>
            </div>
            <div class="out-card">
              <div class="out-h">ruanyifeng.com/blog/atom.xml</div>
              <div class="out-p">【抽取超链接列表】</div>
              <div class="out-link"># 科技爱好者周刊（第 420 期）：最分心的一年 ›</div>
              <div class="out-link"># 科技爱好者周刊（第 419 期）：机房来了，写字楼走了 ›</div>
            </div>
            <div class="out-card" style="background:#0F172A;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-family:Consolas,monospace;font-size:13.5px;color:#38BDF8;font-weight:700;">{"offset":0, "has_more":true}</span>
              <span style="font-size:13px;font-weight:700;color:#4ADE80;">UTF-8 安全切片 · 无乱码</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body></html>`;
}

function buildPreview3Html() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    ${BASE_CSS}
    .shell { position: relative; z-index: 4; padding: 42px 48px; height: 800px; display: flex; flex-direction: column; gap: 24px; }
    .top {
      height: 82px; padding: 0 28px; border-radius: 26px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .tl { display: flex; align-items: center; gap: 16px; }
    .logo { width: 46px; height: 46px; border-radius: 11px; }
    .th { font-size: 38px; }
    .tp { padding: 8px 18px; border-radius: 999px; background: rgba(13,132,255,0.12); color: #0369A1; font-size: 16px; font-weight: 700; }

    .grid { flex: 1; display: flex; gap: 24px; }
    .left { width: 520px; flex: none; border-radius: 32px; padding: 28px; display: flex; flex-direction: column; justify-content: space-between; }
    .right { flex: 1; border-radius: 32px; padding: 28px; display: flex; flex-direction: column; justify-content: space-between; }
    .sh { font-size: 32px; margin-bottom: 10px; }
    .step {
      padding: 16px 18px; border-radius: 22px; background: rgba(255,255,255,0.88);
      border: 1px solid rgba(255,255,255,0.98); display: flex; align-items: center; gap: 16px;
    }
    .s-num {
      width: 40px; height: 40px; border-radius: 20px; background: #0D84FF; color: #FFFFFF;
      font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .s-t { font-size: 18px; font-weight: 800; color: #0F172A; }
    .s-d { font-size: 14px; font-weight: 600; color: #64748B; margin-top: 3px; }
    .s-ico { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; }

    .perm-row {
      padding: 13px 16px; border-radius: 18px; background: rgba(255,255,255,0.86);
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .perm-k {
      padding: 4px 10px; border-radius: 10px; background: #0B1526; color: #38BDF8;
      font-family: Consolas, monospace; font-size: 13px; font-weight: 700; white-space: nowrap;
    }
    .perm-v { font-size: 15px; font-weight: 700; color: #334155; text-align: right; }
  </style></head><body>
    <div class="canvas">
      <img class="bg" style="transform:scaleX(-1);opacity:0.78;" src="${COVER_BG_URI}" alt="" />
      <div class="shell">
        <div class="glass top">
          <div class="tl">
            <img class="logo" src="${PLUGIN_ICON_URI}" alt="" />
            <div class="display th">快速启用指引与透明权限说明</div>
          </div>
          <div class="tp">开源包名配对 · 仅请求必要通讯权限</div>
        </div>

        <div class="grid">
          <div class="glass left">
            <div class="display sh">三步完成手环配对</div>
            <div class="step">
              <div class="s-num">1</div>
              <div style="flex:1;"><div class="s-t">安装快应用《流沙浏览器》</div><div class="s-d">包名 io.github.o_o1112.bandbrowser</div></div>
              <img class="s-ico" src="${APP_ICON_URI}" alt="" />
            </div>
            <div class="step">
              <div class="s-num">2</div>
              <div style="flex:1;"><div class="s-t">安装并启用本同步插件</div><div class="s-d">在 AstroBox 模块列表打开《流沙浏览器同步插件》</div></div>
              <img class="s-ico" src="${PLUGIN_ICON_URI}" alt="" />
            </div>
            <div class="step">
              <div class="s-num">3</div>
              <div style="flex:1;"><div class="s-t">授予联网与通信权限即可浏览</div><div class="s-d">手环首页状态变为「AstroBox 实时联网」即完成</div></div>
            </div>
          </div>

          <div class="glass right">
            <div class="display sh">manifest.json 权限用途清单</div>
            <div class="perm-row"><span class="perm-k">network</span><span class="perm-v">使用 WASI HTTP 抓取用户请求的网页与 RSS</span></div>
            <div class="perm-row"><span class="perm-k">interconnect</span><span class="perm-v">将清洗排版后的正文块回传小米手环 9 Pro</span></div>
            <div class="perm-row"><span class="perm-k">register_interconnect_recv</span><span class="perm-v">监听手环端发送的网址、搜索词与翻页请求</span></div>
            <div class="perm-row"><span class="perm-k">device</span><span class="perm-v">识别当前已连接的小米手环设备地址</span></div>
            <div class="perm-row"><span class="perm-k">thirdpartyapp</span><span class="perm-v">匹配快应用包名 io.github.o_o1112.bandbrowser</span></div>
          </div>
        </div>
      </div>
    </div>
  </body></html>`;
}

function renderHtml(browser, html, outPng) {
  const tmp = path.join(os.tmpdir(), `bb-plugin-store-${Date.now()}-${Math.random().toString(16).slice(2)}.html`);
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
  renderHtml(browser, buildCoverHtml(), path.join(PLUGIN_STORE_DIR, 'plugin_cover.png'));
  renderHtml(browser, buildPreview1Html(), path.join(PLUGIN_STORE_DIR, 'plugin_preview_1.png'));
  renderHtml(browser, buildPreview2Html(), path.join(PLUGIN_STORE_DIR, 'plugin_preview_2.png'));
  renderHtml(browser, buildPreview3Html(), path.join(PLUGIN_STORE_DIR, 'plugin_preview_3.png'));
  console.log('Rendered plugin cover & 3 preview slides (1200x800)');
}

main();
