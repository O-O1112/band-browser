/**
 * Pure URL normalization, search engine routing, history stack, and built-in offline snapshots.
 */

export const QUICK_SHORTCUTS = [
  { id: 'wiki', icon: 'W', label: '维基百科', color: '#38BDF8', bg: '#0F2942', url: 'https://zh.wikipedia.org/wiki/Xiaomi' },
  { id: 'bing', icon: 'B', label: '必应搜索', color: '#34D399', bg: '#0D2F26', url: 'https://cn.bing.com/search?q=小米手环9Pro' },
  { id: 'ddg', icon: 'D', label: 'DDG 轻量', color: '#FBBF24', bg: '#33240B', url: 'https://lite.duckduckgo.com/lite/' },
  { id: 'vela', icon: 'V', label: 'Vela 文档', color: '#F472B6', bg: '#34152B', url: 'https://iot.mi.com/vela/quickapp/zh/' },
  { id: 'hn', icon: 'Y', label: 'HackerNews', color: '#FB923C', bg: '#361B0A', url: 'https://news.ycombinator.com/' },
  { id: 'rss', icon: 'R', label: '阮一峰周刊', color: '#A78BFA', bg: '#221740', url: 'https://www.ruanyifeng.com/blog/atom.xml' },
];

export function extractHost(url) {
  const cleaned = String(url || '')
    .trim()
    .replace(/^https?:\/\//i, '');
  return cleaned.split(/[/?#]/)[0] || cleaned;
}

export function normalizeUrlOrSearch(rawInput, engine = 'bing') {
  const s = String(rawInput || '').trim();
  if (!s) return 'https://zh.wikipedia.org/wiki/Xiaomi';
  if (/^https?:\/\//i.test(s)) return s;
  // Looks like a hostname or domain/path without spaces
  if (!/\s/.test(s) && /^[a-z0-9-]+(\.[a-z0-9-]+)+([/:?#].*)?$/i.test(s)) {
    return `https://${s}`;
  }
  const q = encodeURIComponent(s);
  if (engine === 'ddg') {
    return `https://lite.duckduckgo.com/lite/?q=${q}`;
  }
  return `https://cn.bing.com/search?q=${q}`;
}

export function createHistoryTracker(initialUrl = '') {
  const entries = initialUrl ? [initialUrl] : [];
  let cursor = entries.length - 1;

  return {
    visit(url) {
      if (!url) return;
      if (cursor >= 0 && entries[cursor] === url) return;
      entries.splice(cursor + 1);
      entries.push(url);
      cursor = entries.length - 1;
    },
    canBack() {
      return cursor > 0;
    },
    canForward() {
      return cursor >= 0 && cursor + 1 < entries.length;
    },
    back() {
      if (!this.canBack()) return null;
      cursor -= 1;
      return entries[cursor];
    },
    forward() {
      if (!this.canForward()) return null;
      cursor += 1;
      return entries[cursor];
    },
    current() {
      return cursor >= 0 ? entries[cursor] : '';
    },
    size() {
      return entries.length;
    },
  };
}

const OFFLINE_DEMO_PAGES = {
  'https://zh.wikipedia.org/wiki/Xiaomi': {
    url: 'https://zh.wikipedia.org/wiki/Xiaomi',
    title: '小米科技 - 维基百科（演示快照）',
    host: 'zh.wikipedia.org',
    blocks: [
      { kind: 'h', text: '小米科技与 Xiaomi Vela' },
      { kind: 'p', text: '小米手环 9 Pro 运行基于 Apache NuttX 的 Xiaomi Vela 轻量系统。连接 AstroBox 插件后，Rust 端会实时抓取目标网页、清除脚本样式，并将标题、正文与可点击超链接送到手腕渲染。' },
      { kind: 'p', text: '当前处于未配对演示模式，你可以直接点击下方蓝色超链接测试多级跳页与底部后退/前进堆栈。' },
    ],
    links: [
      { label: 'Apache NuttX 嵌入式内核介绍', url: 'https://zh.wikipedia.org/wiki/NuttX' },
      { label: '查看 68k 极简新闻今日头条', url: 'https://68k.news/' },
      { label: '前往 Hacker News 技术热榜', url: 'https://news.ycombinator.com/' },
    ],
    offset: 0,
    next_offset: 0,
    has_more: false,
    demo: true,
  },
  'https://zh.wikipedia.org/wiki/NuttX': {
    url: 'https://zh.wikipedia.org/wiki/NuttX',
    title: 'Apache NuttX 实时操作系统',
    host: 'zh.wikipedia.org',
    blocks: [
      { kind: 'h', text: 'POSIX 兼容的嵌入式 RTOS' },
      { kind: 'p', text: 'NuttX 注重标准合规性与极小内存占用，被广泛应用于可穿戴设备、无人机与 IoT 传感器。这也是《流沙浏览器》能以纯阅读模式流畅运行的底层基础。' },
    ],
    links: [
      { label: '返回 小米科技 - 维基百科', url: 'https://zh.wikipedia.org/wiki/Xiaomi' },
      { label: '访问 阮一峰科技周刊 Atom', url: 'https://www.ruanyifeng.com/blog/atom.xml' },
    ],
    offset: 0,
    next_offset: 0,
    has_more: false,
    demo: true,
  },
  'https://iot.mi.com/vela/quickapp/zh/': {
    url: 'https://iot.mi.com/vela/quickapp/zh/',
    title: 'Xiaomi Vela JS 应用',
    host: 'iot.mi.com',
    blocks: [
      { kind: 'h', text: 'JS应用开发文档' },
      { kind: 'p', text: '开发者友好，性能高效的IoT跨端应用框架' },
    ],
    links: [
      { label: '快速开始', url: 'https://iot.mi.com/vela/quickapp/zh/guide/' },
      { label: '查看维基百科 Xiaomi 词条', url: 'https://zh.wikipedia.org/wiki/Xiaomi' },
    ],
    offset: 0,
    next_offset: 0,
    has_more: false,
    demo: true,
  },
};

export function getOfflineDemoPage(url) {
  if (OFFLINE_DEMO_PAGES[url]) {
    return OFFLINE_DEMO_PAGES[url];
  }
  const host = extractHost(url);
  return {
    url,
    title: `${host || '网页预览'}（未连 AstroBox）`,
    host,
    blocks: [
      { kind: 'h', text: '当前手环未检测到 AstroBox 插件在线' },
      { kind: 'p', text: `请求目标：${url}` },
      { kind: 'p', text: '开启配套插件 Band-Browser-1.0.0.abp 后，无需额外启动电脑服务器，插件会直接通过 WASI HTTP 抓取该网页并抽取正文与所有超链接。' },
    ],
    links: [
      { label: '体验演示跳转：小米科技 - 维基百科', url: 'https://zh.wikipedia.org/wiki/Xiaomi' },
      { label: '体验演示跳转：68k 纯文本简讯', url: 'https://68k.news/' },
    ],
    offset: 0,
    next_offset: 0,
    has_more: false,
    demo: true,
  };
}
