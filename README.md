# 《流沙浏览器》(Band Web Browser)

專為 **小米手環 9 Pro (`336×480`, Xiaomi Vela OS)** 打造的輕量網頁閱讀器，採用經典 **無源流沙 UI** 視覺規範（純黑 AMOLED 底色、`#262626` 卡片搭配細邊框、頂部 `hd.png` 漸層遮罩、`72×72` 圓形浮動操作鍵與雙色分欄格）。透過配套的 **AstroBox Rust WASM 插件 (`Band-Browser-1.0.0.abp`)** 內建 WASI HTTP 直接抓取目標網頁並剝除腳本廣告，免開任何額外電腦程式，將標題、正文、RSS 段落與可點擊超連結傳送至手環渲染。

## 產品架構

- **手環端快應用 (`src/`, `io.github.o_o1112.bandbrowser`)**：
  - `home`：**無源流沙 UI** 首頁（`324px` 全寬 `#262626` 大圓角膠囊搜尋列、AstroBox 連線狀態卡、全寬無框常用網站列表卡、書籤與離線頁）。
  - `reader`：**無源流沙 UI** 閱讀視圖（精簡網址膠囊、標題資訊卡、深灰閱讀卡片、超連結跳轉卡與底部「‹ 后退 / 收藏 / 前进 ›」膠囊導航欄）。
  - `address`：整合米壇開源拼音鍵盤，含左對齊網址輸入框、游標左右微調、Bing/DDG 引擎切換與右側 `#3184D0` 確認圓鍵，自動補齊 `https://` 或轉搜尋。
- **AstroBox V2 WASM 插件 (`astrobox-plugin/`, `Band-Browser-1.0.0.abp`)**：
  - 使用 Rust + `waki` WASI HTTP 發起多跳轉定向請求，內建無依賴通用 HTML/RSS 正文與相對連結抽取器（UTF-8 分段分頁）。

## 開發、測試與建置

```bash
npm test             # Node 單元測試 (網址規範化、歷史棧、離線快照)
npm run test:rust    # Rust WASM 網頁正文與超連結抽取器單元測試
npm run build:abp    # 編譯 Band-Browser-1.0.0.abp 插件
npm run build:rpk    # 打包 dist/io.github.o_o1112.bandbrowser.release.rpk 並同步 .abp
npm run verify:emu   # Vela 模擬器實機走查並輸出截圖
npm run render:store # 生成 AstroBox 1200x800 (3:2) 封面與 4 機實機預覽圖
```

## 發布產物

- 快應用套件：`dist/io.github.o_o1112.bandbrowser.release.rpk`
- 配套 AstroBox 插件：`dist/Band-Browser-1.0.0.abp`
- 商店圖示：`src/common/logo.png` (`192×192` Squircle)
- 商店封面與預覽：`docs/store/astrobox_cover.png`、`docs/store/astrobox_preview.png`
