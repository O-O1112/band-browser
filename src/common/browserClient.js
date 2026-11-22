/**
 * Interconnect client & persistent bookmark/offline cache store for Band Browser.
 */

import interconnect from '@system.interconnect';
import storage from '@system.storage';
import { getOfflineDemoPage, QUICK_SHORTCUTS } from './browserUtils.js';

const PROTOCOL_VERSION = 2;
const BOOKMARKS_KEY = 'band_browser_bookmarks_v1';
const SAVED_PAGES_KEY = 'band_browser_saved_v1';
const REQUEST_TIMEOUT_MS = 12000;

function loadJson(key, fallback) {
  return new Promise((resolve) => {
    storage.get({
      key,
      default: '',
      success(raw) {
        if (!raw) return resolve(fallback);
        try {
          resolve(JSON.parse(raw));
        } catch (_) {
          resolve(fallback);
        }
      },
      fail() {
        resolve(fallback);
      },
    });
  });
}

function saveJson(key, value) {
  return new Promise((resolve) => {
    storage.set({
      key,
      value: JSON.stringify(value),
      complete: () => resolve(),
    });
  });
}

export function createBrowserClient() {
  let conn = null;
  let readyState = 0;
  let seq = 0;
  const pending = Object.create(null);
  const statusListeners = [];

  function notifyStatus(online) {
    statusListeners.forEach((fn) => {
      try { fn(Boolean(online)); } catch (_) {}
    });
  }

  function subscribeStatus(fn) {
    if (typeof fn !== 'function') return () => {};
    statusListeners.push(fn);
    return () => {
      const idx = statusListeners.indexOf(fn);
      if (idx >= 0) statusListeners.splice(idx, 1);
    };
  }

  function settleAll(errText) {
    Object.keys(pending).forEach((id) => {
      const p = pending[id];
      delete pending[id];
      if (p.timer) clearTimeout(p.timer);
      p.reject(new Error(errText));
    });
  }

  function handleMessage(evt) {
    let msg = evt && Object.prototype.hasOwnProperty.call(evt, 'data') ? evt.data : evt;
    if (typeof msg === 'string') {
      try {
        msg = JSON.parse(msg);
      } catch (_) {
        return;
      }
    }
    if (!msg || msg.v !== PROTOCOL_VERSION || msg.type !== 'response' || !msg.id) return;
    const entry = pending[msg.id];
    if (!entry) return;
    delete pending[msg.id];
    if (entry.timer) clearTimeout(entry.timer);
    if (msg.ok === true) {
      entry.resolve(msg.result || {});
    } else {
      entry.reject(new Error(String(msg.error || '网页抓取失败')));
    }
  }

  function ensureConnection() {
    if (conn) return true;
    if (!interconnect || typeof interconnect.instance !== 'function') return false;
    try {
      conn = interconnect.instance();
      conn.onmessage = handleMessage;
      conn.onopen = () => {
        readyState = 1;
        notifyStatus(true);
      };
      conn.onclose = () => {
        readyState = 0;
        conn = null;
        notifyStatus(false);
        settleAll('AstroBox 连接已断开');
      };
      conn.onerror = () => { readyState = 0; };
      if (typeof conn.getReadyState === 'function') {
        conn.getReadyState({
          success: (d) => {
            if (d && typeof d.status === 'number') {
              readyState = d.status;
              if (readyState === 1) notifyStatus(true);
            }
          },
          fail: () => {},
        });
      }
      return true;
    } catch (_) {
      conn = null;
      return false;
    }
  }

  function formatSendError(err, code) {
    if (typeof err === 'string' && err) return err;
    if (err && typeof err === 'object') {
      const msg = err.errMsg || err.message || err.data;
      if (typeof msg === 'string' && msg) return msg;
      if (typeof err.code !== 'undefined') return `错误码 ${err.code}`;
    }
    if (typeof code !== 'undefined' && code !== null) return `错误码 ${code}`;
    return '未连接手机 AstroBox';
  }

  function waitReady(timeoutMs = 700) {
    if (!ensureConnection()) return Promise.resolve(false);
    if (readyState === 1) return Promise.resolve(true);
    return new Promise((resolve) => {
      const started = Date.now();
      const probe = () => {
        if (readyState === 1) return resolve(true);
        if (Date.now() - started >= timeoutMs) {
          // Even if onopen/getReadyState hasn't flipped yet, attempt conn.send so
          // the system fail callback reports exact status instead of skipping live requests.
          return resolve(true);
        }
        setTimeout(probe, 100);
      };
      setTimeout(probe, 100);
    });
  }

  async function sendRequest(action, payload, timeoutMs = REQUEST_TIMEOUT_MS) {
    const canSend = await waitReady(action === 'ping' ? 600 : 700);
    if (!canSend || !ensureConnection()) {
      throw new Error('Interconnect 不可用');
    }
    return new Promise((resolve, reject) => {
      const id = `bb_${Date.now()}_${++seq}`;
      const timer = setTimeout(() => {
        if (pending[id]) {
          delete pending[id];
          reject(new Error('AstroBox 插件无响应（请开启 Band Browser Sync）'));
        }
      }, timeoutMs);

      pending[id] = { resolve, reject, timer };
      try {
        conn.send({
          data: {
            v: PROTOCOL_VERSION,
            type: 'request',
            id,
            action,
            payload: payload || {},
          },
          fail(err, code) {
            if (pending[id]) {
              clearTimeout(pending[id].timer);
              delete pending[id];
              reject(new Error(`蓝牙未就绪（${formatSendError(err, code)}）`));
            }
          },
        });
      } catch (e) {
        if (pending[id]) {
          clearTimeout(pending[id].timer);
          delete pending[id];
        }
        reject(e);
      }
    });
  }

  async function checkOnline() {
    try {
      const r = await sendRequest('ping', {}, 4500);
      const ok = Boolean(r && r.pong);
      notifyStatus(ok);
      return ok;
    } catch (_) {
      return false;
    }
  }

  async function fetchWebPage(url, offset = 0, maxChars = 1600) {
    try {
      const res = await sendRequest('browse', { url, offset, maxChars });
      notifyStatus(true);
      return { ...res, demo: false };
    } catch (err) {
      // Fallback to offline saved page if cached, otherwise demo with exact error notice
      const saved = await getSavedPage(url);
      if (saved) return { ...saved, offlineSaved: true };
      const demo = getOfflineDemoPage(url);
      demo.notice = (err && err.message) || '插件暂未响应';
      return demo;
    }
  }

  async function getBookmarks() {
    const list = await loadJson(BOOKMARKS_KEY, null);
    if (Array.isArray(list) && list.length > 0) return list;
    return QUICK_SHORTCUTS.slice(0, 3).map((s) => ({ title: s.label, url: s.url }));
  }

  async function toggleBookmark(title, url) {
    const list = await getBookmarks();
    const idx = list.findIndex((b) => b.url === url);
    let saved = false;
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.unshift({ title: title || url, url });
      saved = true;
    }
    await saveJson(BOOKMARKS_KEY, list.slice(0, 16));
    return saved;
  }

  async function saveOfflinePage(page) {
    const map = await loadJson(SAVED_PAGES_KEY, {});
    map[page.url] = {
      url: page.url,
      title: page.title,
      host: page.host,
      blocks: (page.blocks || []).slice(0, 12),
      links: (page.links || []).slice(0, 8),
      offset: 0,
      next_offset: 0,
      has_more: false,
    };
    await saveJson(SAVED_PAGES_KEY, map);
  }

  async function getSavedPage(url) {
    const map = await loadJson(SAVED_PAGES_KEY, {});
    return map[url] || null;
  }

  return {
    checkOnline,
    subscribeStatus,
    fetchWebPage,
    getBookmarks,
    toggleBookmark,
    saveOfflinePage,
  };
}
