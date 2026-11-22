# 《流沙浏览器》(Band Web Browser) 實作與驗收紀錄

已完成 **小米手環 9 Pro (`io.github.o_o1112.bandbrowser.release.rpk`) ＋ 免電腦代理 AstroBox V2 WASM 插件 (`Band-Browser-1.0.0.abp`)** 的全棧優化、**無源流沙 UI** 精修，以及非套板客製化「液態流沙」商店視覺圖與上架準備。

## 1. 產物清單（可直接上架 AstroBox）
- **手環端快應用**：`dist/io.github.o_o1112.bandbrowser.release.rpk`（`89,747 bytes` / `87.6 KB`）
  - **無源流沙 UI 精修**：`324px` 全寬 `#262626` / `#191919` 無框圓角卡片、純淨 `#262626` / `#0D84FF` `72×72` 圓形頂欄按鍵；閱讀頁加上狀態標籤與明確重試提示；快捷清單整合 `iot.mi.com/vela/quickapp/zh/` 等可達站點。
  - **Interconnect 自動訂閱與重連優化**：`browserClient.js` 等待通道就緒最多 `700ms` 並照常嘗試透過物件格式發送請求，連線開啟時即時切換線上燈號。
- **AstroBox V2 外掛**：`astrobox-plugin/dist/Band-Browser-1.0.0.abp`（`139,038 bytes`）
  - 補上 `Accept-Encoding: identity` 防止回傳壓縮亂碼；HTML/XML 抽取器 (`html_reader.rs`) 新增 `<nav>`/`<footer>` 雜訊過濾與 **Atom `<entry>` / RSS `<item>` 連結抽取**。
- **非套板液態流沙商店視覺 (`1200×800`)**：
  - `docs/store/astrobox_cover.png`（`849,144 bytes`）：以珠光液態玻璃與銀沙流動攝影質感為底，搭配頂部磨砂透明網址列（真實 `iot.mi.com/vela/quickapp/zh/`）、兩張透光浮動網頁抽取卡（真實 `iot.mi.com` 段落與 `ruanyifeng.com/blog/atom.xml` 週刊連結）及右側鈦銀手環 9 Pro 實機。
  - `docs/store/astrobox_preview_1.png`（`501,691 bytes`）、`astrobox_preview_2.png`（`636,485 bytes`）、`astrobox_preview_3.png`（`450,678 bytes`）：依 AstroBox 需求產出 3 張不同視角與功能焦點的 `1200×800` 非對稱 Bento／功能分欄預覽圖，涵蓋總覽、無源流沙閱讀與分頁、HTML/Atom 超連結跳頁與全拼輸入。
  - `src/common/logo.png` (`192×192`, `6,371 bytes` 圓角平面向量圖示)、`docs/store/ASTROBOX_SUBMISSION.md`。

## 2. 最新驗證結果（全部通過）
- **Rust 單元測試 (`cargo test --offline`)**：`6 / 6` 通過（含 Atom/RSS 條目連結抽取與 `<nav>` 過濾測試）。
- **Node 單元測試 (`npm test`)**：`4 / 4` 通過。
- **Vela 模擬器實機走查 (`verify-emulator.cjs`)**：首頁卡片 (`流沙浏览器`) → 維基百科閱讀頁 → 超連結清單卡 → 連結跳轉頁 → 網址與搜尋鍵盤頁全部截圖正常渲染，共 `1,023` 次 `JsCall`（平均 `1,430.69 μs`）。
