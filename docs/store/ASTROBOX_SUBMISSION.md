# 《流沙浏览器》AstroBox 上架表单填写指南

## 1. 上传文件清单
- **快应用安装包 (`.rpk`)**：`dist/io.github.o_o1112.bandbrowser.release.rpk`（`89,747 bytes`）
- **配套 AstroBox 插件 (`.abp`)**：`astrobox-plugin/dist/Band-Browser-1.0.0.abp`（`139,038 bytes`）
- **应用图标 (`192×192`)**：`src/common/logo.png`
- **封面图 (`1200×800`)**：`docs/store/astrobox_cover.png`
- **详情预览图（3 张 `1200×800`）**：
  1. `docs/store/astrobox_preview_1.png`
  2. `docs/store/astrobox_preview_2.png`
  3. `docs/store/astrobox_preview_3.png`

## 2. 基础信息字段
- **资源名称**：`流沙浏览器`
- **应用包名**：`io.github.o_o1112.bandbrowser`
- **版本号**：`1.0.0`
- **作者**：`O-O1112`
- **适配设备**：Xiaomi Smart Band 9 Pro（`336×480`）
- **一句话简介**：小米手环 9 Pro 轻量通用网页浏览器，支持正文重排、搜索直达与超链接逐层阅读。
- **标签（至少 3 个）**：`浏览器`、`实用工具`、`网页阅读`、`小米手环9Pro`、`无源流沙`

## 3. 更新日志（1.0.0 首发版本）

```text
v1.0.0 首发版本
- 全新《流沙浏览器》上线，采用小米手环 9 Pro 原生深色无源流沙阅读界面
- 支持输入网址与关键词直达，内置全拼输入法键盘与 Bing / DuckDuckGo 轻量化搜索
- 配合 AstroBox 同步插件实现实时网页正文抽取、HTML/Atom 超链接多级跳页、历史前进后退与本地离线收藏
```

## 4. 资源详情介绍（直接复制，已精简至 2 种样式以内以符合 AstroBox 审核要求）

```markdown
流沙浏览器是专为小米手环 9 Pro 打造的轻量通用网页阅读器，采用无源流沙深色阅读界面，搭配配套 AstroBox 同步插件模块即可免开电脑服务端访问互联网网页。

功能特点
- 通用网页阅读模式：自动抽取网页标题、正文段落与 RSS/Atom 内容，支持分页加载下一段
- 可点击超链接跳转：自动解析页面相对与绝对超链接，支持多级跳页与后退/前进历史栈
- 手腕搜索与输入：内置全键盘与光标微调，输入域名自动补全，关键词支持必应 / DuckDuckGo 轻量化搜索
- 书签与离线缓存：支持一键收藏网页并离线保存，无网络时仍可浏览已存内容与内置示例页

使用方式
1. 在 AstroBox 中安装手环端快应用 io.github.o_o1112.bandbrowser.release.rpk
2. 在 AstroBox 模块区搜索安装并启用配套插件《流沙浏览器同步插件》（需授予 network 与 interconnect 权限）
3. 保持手环与 AstroBox 连接，在手环打开流沙浏览器即可浏览实时网页
```
