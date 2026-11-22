import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractHost,
  normalizeUrlOrSearch,
  createHistoryTracker,
  getOfflineDemoPage,
} from '../src/common/browserUtils.js';

test('normalizeUrlOrSearch keeps full URLs, prepends https to domains, and formats searches', () => {
  assert.equal(normalizeUrlOrSearch('https://68k.news/'), 'https://68k.news/');
  assert.equal(normalizeUrlOrSearch('zh.wikipedia.org/wiki/Xiaomi'), 'https://zh.wikipedia.org/wiki/Xiaomi');
  assert.equal(
    normalizeUrlOrSearch('小米手环 9 Pro', 'bing'),
    'https://cn.bing.com/search?q=%E5%B0%8F%E7%B1%B3%E6%89%8B%E7%8E%AF%209%20Pro'
  );
  assert.equal(
    normalizeUrlOrSearch('rust wasm', 'ddg'),
    'https://lite.duckduckgo.com/lite/?q=rust%20wasm'
  );
});

test('extractHost parses host cleanly', () => {
  assert.equal(extractHost('https://zh.wikipedia.org/wiki/Xiaomi?foo=1'), 'zh.wikipedia.org');
});

test('createHistoryTracker manages visit, back, forward, and branch truncation', () => {
  const h = createHistoryTracker('https://a.com');
  h.visit('https://b.com');
  h.visit('https://c.com');
  assert.equal(h.canBack(), true);
  assert.equal(h.canForward(), false);
  assert.equal(h.back(), 'https://b.com');
  assert.equal(h.canForward(), true);
  h.visit('https://d.com');
  assert.equal(h.canForward(), false);
  assert.equal(h.back(), 'https://b.com');
  assert.equal(h.forward(), 'https://d.com');
});

test('getOfflineDemoPage returns linked demonstration articles', () => {
  const page = getOfflineDemoPage('https://zh.wikipedia.org/wiki/Xiaomi');
  assert.equal(page.host, 'zh.wikipedia.org');
  assert.ok(page.links.length >= 2);
});
