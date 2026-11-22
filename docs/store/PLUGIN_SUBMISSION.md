# 《流沙浏览器同步插件》AstroBox 模块上架表单填写指南

## 1. 上传文件清单
- **模块安装包 (`.abp`)**：`astrobox-plugin/dist/Band-Browser-1.0.0.abp`（`139,038 bytes`）
- **应用图标 (`192×192` 圆角透明)**：`astrobox-plugin/icon.png`（`4,907 bytes`）
- **封面图 (`1200×800`, 3:2)**：`docs/store/plugin/plugin_cover.png`
- **详情预览图（3 张 `1200×800`, 3:2）**：
  1. `docs/store/plugin/plugin_preview_1.png`
  2. `docs/store/plugin/plugin_preview_2.png`
  3. `docs/store/plugin/plugin_preview_3.png`

## 2. 基础信息字段
- **资源名称**：`流沙浏览器同步插件`
- **包名 / 资源 ID**：`band-browser-sync`（或保留平台自动识别名称 `流沙浏览器同步插件`）
- **版本号**：`1.0.0`
- **作者**：`O-O1112`
- **适用系统**：AstroBox V2（WASI Preview 2 · API Level 3）
- **一句话简介**：流沙浏览器配套网络代理模块，免开电脑代理直接通过 WASI HTTP 抓取网页并传送至小米手环 9 Pro。
- **标签（至少 3 个）**：`网络代理`、`流沙浏览器`、`WASM插件`、`小米手环9Pro`、`网页阅读`

## 3. 更新日志（1.0.0 首发版本）

```text
v1.0.0 首发版本
- 集成 waki WASI HTTP 客户端，支持免开电脑服务端直连互联网 HTTPS 与重定向跟踪
- 内置无依赖 HTML / Atom / RSS 清洗内核，自动过滤 script / style / nav / footer 等冗余内容并支持 UTF-8 分页
- 支持提取相对与绝对超链接传送至小米手环 9 Pro《流沙浏览器》(io.github.o_o1112.bandbrowser)
```

## 4. 资源详情介绍（已精简至 2 种样式以内，符合 AstroBox 审核要求）

```markdown
流沙浏览器同步插件是配套小米手环 9 Pro 快应用《流沙浏览器》（包名 io.github.o_o1112.bandbrowser）的 AstroBox V2 网络代理模块。安装启用后无需在电脑运行任何转发服务，即可直接让手环访问互联网网页与订阅源。

核心能力
- 免电脑直接联网：通过 WASI HTTP 发起请求并自动添加 Accept-Encoding: identity 防止压缩乱码
- 通用正文净化引擎：自动剔除脚本、样式、导航栏与页脚广告，按手环屏幕切分纯阅读段落
- RSS / Atom 与超链接抽取：支持抓取博客、周刊条目与相对路径，在手腕上点击链接逐层续读
- 透明最小权限：仅向配套包名 io.github.o_o1112.bandbrowser 开放 Interconnect 数据通道

使用步骤
1. 同时安装手环端快应用《流沙浏览器》及本同步插件模块
2. 在 AstroBox 中启用《流沙浏览器同步插件》并授予 network 与 interconnect 权限
3. 保持手环与 AstroBox 蓝牙连接，在手环打开《流沙浏览器》即可实时上网
```

## 5. AstroBox 官方插件源（AstroBox-NG-Plugin-Repo）PR 提交流程（方法 B）

1. 将本仓库（需包含根目录 `index.txt` 指向 `astrobox-plugin/dist`，以及已提交追踪的 `astrobox-plugin/dist/manifest.json`、`icon.png`、`band_browser_sync.wasm`）推送至 GitHub（例如 `https://github.com/O-O1112/band-browser` 的 `main` 分支）。
2. Fork 官方插件索引仓库 `AstralSightStudios/AstroBox-NG-Plugin-Repo`。
3. 在 Fork 仓库根目录 `index.txt` 末尾追加一行：
   ```text
   https://raw.githubusercontent.com/O-O1112/band-browser/refs/heads/main/
   ```
4. 向 `AstralSightStudios/AstroBox-NG-Plugin-Repo` 提交 Pull Request 即可进入审核索引流水线。

