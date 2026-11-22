use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ExtractedLink {
    pub label: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ContentBlock {
    pub kind: String, // "h" (heading) | "p" (paragraph/item)
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ReadablePage {
    pub url: String,
    pub title: String,
    pub host: String,
    pub blocks: Vec<ContentBlock>,
    pub links: Vec<ExtractedLink>,
    pub offset: usize,
    pub next_offset: usize,
    pub has_more: bool,
    pub total_chars: usize,
}

pub fn extract_host(url: &str) -> String {
    let rest = url
        .strip_prefix("https://")
        .or_else(|| url.strip_prefix("http://"))
        .unwrap_or(url);
    rest.split(['/', '?', '#'])
        .next()
        .unwrap_or(rest)
        .to_string()
}

pub fn resolve_url(base_url: &str, href: &str) -> Option<String> {
    let raw = href.trim();
    if raw.is_empty()
        || raw.starts_with('#')
        || raw.starts_with("javascript:")
        || raw.starts_with("mailto:")
        || raw.starts_with("tel:")
        || raw.starts_with("data:")
    {
        return None;
    }
    if raw.starts_with("http://") || raw.starts_with("https://") {
        return Some(raw.to_string());
    }
    let scheme = if base_url.starts_with("http://") {
        "http:"
    } else {
        "https:"
    };
    if raw.starts_with("//") {
        return Some(format!("{scheme}{raw}"));
    }
    let host = extract_host(base_url);
    if host.is_empty() {
        return None;
    }
    let origin = format!("{scheme}//{host}");
    if raw.starts_with('/') {
        return Some(format!("{origin}{raw}"));
    }
    let after_scheme = base_url
        .strip_prefix("https://")
        .or_else(|| base_url.strip_prefix("http://"))
        .unwrap_or(base_url);
    let path_part = after_scheme.split(['?', '#']).next().unwrap_or("");
    let dir = match path_part.rfind('/') {
        Some(idx) if idx > host.len() => &path_part[host.len()..=idx],
        _ => "/",
    };
    let clean_rel = raw.strip_prefix("./").unwrap_or(raw);
    Some(format!("{origin}{dir}{clean_rel}"))
}

pub fn decode_entities(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut rest = input;
    while let Some(amp) = rest.find('&') {
        out.push_str(&rest[..amp]);
        let after = &rest[amp..];
        if let Some(semi) = after.find(';').filter(|&i| i <= 10) {
            let entity = &after[1..semi];
            let decoded = match entity {
                "amp" => Some('&'),
                "lt" => Some('<'),
                "gt" => Some('>'),
                "quot" => Some('"'),
                "apos" | "#39" | "#x27" => Some('\''),
                "nbsp" => Some(' '),
                "mdash" => Some('—'),
                "ndash" => Some('–'),
                "hellip" => Some('…'),
                _ if entity.starts_with("#x") || entity.starts_with("#X") => {
                    u32::from_str_radix(&entity[2..], 16).ok().and_then(char::from_u32)
                }
                _ if entity.starts_with('#') => {
                    entity[1..].parse::<u32>().ok().and_then(char::from_u32)
                }
                _ => None,
            };
            if let Some(ch) = decoded {
                out.push(ch);
                rest = &after[semi + 1..];
                continue;
            }
        }
        out.push('&');
        rest = &rest[amp + 1..];
    }
    out.push_str(rest);
    out
}

fn collapse_ws(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut prev_ws = true;
    for ch in s.chars() {
        if ch.is_whitespace() {
            if !prev_ws {
                out.push(' ');
                prev_ws = true;
            }
        } else {
            out.push(ch);
            prev_ws = false;
        }
    }
    out.trim().to_string()
}

fn strip_tags(fragment: &str) -> String {
    let mut out = String::with_capacity(fragment.len());
    let mut in_tag = false;
    for ch in fragment.chars() {
        match ch {
            '<' => {
                in_tag = true;
                out.push(' ');
            }
            '>' => in_tag = false,
            _ if !in_tag => out.push(ch),
            _ => {}
        }
    }
    collapse_ws(&decode_entities(&out))
}

fn strip_block_tags(html: &str, tags: &[(&str, &str)]) -> String {
    let lower = html.to_ascii_lowercase();
    let mut result = String::with_capacity(html.len());
    let mut cursor = 0usize;
    let bytes = lower.as_bytes();

    while cursor < html.len() {
        let mut next_skip: Option<(usize, &str)> = None;
        for &(open, close) in tags {
            if let Some(rel) = lower[cursor..].find(open) {
                let pos = cursor + rel;
                if next_skip.is_none_or(|(best, _)| pos < best) {
                    next_skip = Some((pos, close));
                }
            }
        }
        match next_skip {
            None => {
                result.push_str(&html[cursor..]);
                break;
            }
            Some((pos, close)) => {
                if pos > cursor {
                    result.push_str(&html[cursor..pos]);
                }
                let search_from = pos + 1;
                if search_from >= bytes.len() {
                    break;
                }
                match lower[search_from..].find(close) {
                    Some(end_rel) => {
                        cursor = search_from + end_rel + close.len();
                    }
                    None => break,
                }
            }
        }
    }
    result
}

fn remove_ignored_blocks(html: &str) -> String {
    let base = strip_block_tags(
        html,
        &[
            ("<script", "</script>"),
            ("<style", "</style>"),
            ("<noscript", "</noscript>"),
            ("<svg", "</svg>"),
            ("<!--", "-->"),
        ],
    );
    // Strip <nav> and <footer> chrome only when non-nav content remains rich
    let denoised = strip_block_tags(&base, &[("<nav", "</nav>"), ("<footer", "</footer>")]);
    if strip_tags(&denoised).chars().count() >= 120 {
        denoised
    } else {
        base
    }
}

fn extract_tag_inner(html: &str, lower: &str, open_prefix: &str, close_tag: &str) -> Option<String> {
    let start = lower.find(open_prefix)?;
    let gt_rel = lower[start..].find('>')?;
    let content_start = start + gt_rel + 1;
    let end_rel = lower[content_start..].find(close_tag)?;
    Some(html[content_start..content_start + end_rel].to_string())
}

fn extract_attr(tag_slice: &str, attr_name: &str) -> Option<String> {
    let lower = tag_slice.to_ascii_lowercase();
    let pattern = format!("{attr_name}=");
    let pos = lower.find(&pattern)?;
    let rest = tag_slice[pos + pattern.len()..].trim_start();
    if let Some(after_q) = rest.strip_prefix('"') {
        let end = after_q.find('"')?;
        return Some(after_q[..end].to_string());
    }
    if let Some(after_q) = rest.strip_prefix('\'') {
        let end = after_q.find('\'')?;
        return Some(after_q[..end].to_string());
    }
    let end = rest.find(|c: char| c.is_whitespace() || c == '>').unwrap_or(rest.len());
    Some(rest[..end].to_string())
}

fn is_chrome_link(label: &str) -> bool {
    let low = label.trim().to_ascii_lowercase();
    matches!(
        low.as_str(),
        "skip to content"
            | "jump to content"
            | "login"
            | "sign in"
            | "sign up"
            | "register"
            | "privacy"
            | "terms"
            | "跳转到内容"
            | "跳至内容"
            | "登录"
            | "注册"
            | "隐私政策"
            | "使用条款"
    )
}

fn push_unique_link(
    links: &mut Vec<ExtractedLink>,
    seen_urls: &mut HashSet<String>,
    label: String,
    resolved: String,
) {
    if links.len() >= 16 || is_chrome_link(&label) {
        return;
    }
    let label_chars = label.chars().count();
    if label_chars >= 2 && seen_urls.insert(resolved.clone()) {
        let short_label: String = if label_chars > 36 {
            let s: String = label.chars().take(34).collect();
            format!("{s}..")
        } else {
            label
        };
        links.push(ExtractedLink {
            label: short_label,
            url: resolved,
        });
    }
}

fn extract_blocks_and_links(cleaned: &str, base_url: &str) -> (Vec<ContentBlock>, Vec<ExtractedLink>) {
    let lower = cleaned.to_ascii_lowercase();
    let mut blocks: Vec<ContentBlock> = Vec::new();
    let mut seen_text: HashSet<String> = HashSet::new();
    let mut links: Vec<ExtractedLink> = Vec::new();
    let mut seen_urls: HashSet<String> = HashSet::new();

    // Extract heading/paragraph-like semantic blocks in document order
    let mut cursor = 0usize;
    let block_tags: &[(&str, &str, &str)] = &[
        ("<h1", "</h1>", "h"),
        ("<h2", "</h2>", "h"),
        ("<h3", "</h3>", "h"),
        ("<p", "</p>", "p"),
        ("<li", "</li>", "p"),
        ("<blockquote", "</blockquote>", "p"),
        ("<summary", "</summary>", "p"),
        ("<description", "</description>", "p"),
    ];

    while cursor < cleaned.len() && blocks.len() < 48 {
        let mut best: Option<(usize, &str, &str, &str)> = None;
        for &(open, close, kind) in block_tags {
            if let Some(rel) = lower[cursor..].find(open) {
                let pos = cursor + rel;
                let after = lower.as_bytes().get(pos + open.len()).copied();
                if matches!(after, Some(b'>' | b' ' | b'\n' | b'\r' | b'\t'))
                    && best.is_none_or(|(bpos, _, _, _)| pos < bpos)
                {
                    best = Some((pos, open, close, kind));
                }
            }
        }
        let Some((pos, _, close, kind)) = best else {
            break;
        };
        let Some(gt_rel) = lower[pos..].find('>') else {
            break;
        };
        let inner_start = pos + gt_rel + 1;
        let Some(end_rel) = lower[inner_start..].find(close) else {
            cursor = inner_start;
            continue;
        };
        let inner = &cleaned[inner_start..inner_start + end_rel];
        let text = strip_tags(inner);
        let min_len = if kind == "h" { 2 } else { 8 };
        if text.chars().count() >= min_len && seen_text.insert(text.clone()) {
            blocks.push(ContentBlock {
                kind: kind.to_string(),
                text,
            });
        }
        cursor = inner_start + end_rel + close.len();
    }

    // Fallback plain-text stripping if target page used bare divs without semantic <p>/<li>
    if blocks.is_empty() {
        let body_slice = extract_tag_inner(cleaned, &lower, "<body", "</body>")
            .unwrap_or_else(|| cleaned.to_string());
        let plain = strip_tags(&body_slice);
        if !plain.is_empty() {
            blocks.push(ContentBlock {
                kind: "p".to_string(),
                text: plain,
            });
        }
    }

    // Extract Atom <entry> / RSS <item> links so XML feeds work seamlessly as clickable cards
    for &(entry_open, entry_close) in &[("<entry", "</entry>"), ("<item", "</item>")] {
        let mut ecur = 0usize;
        while ecur < cleaned.len() && links.len() < 16 {
            let Some(rel) = lower[ecur..].find(entry_open) else {
                break;
            };
            let pos = ecur + rel;
            let Some(gt_rel) = lower[pos..].find('>') else {
                break;
            };
            let start = pos + gt_rel + 1;
            let Some(end_rel) = lower[start..].find(entry_close) else {
                break;
            };
            let slice = &cleaned[start..start + end_rel];
            let slice_low = &lower[start..start + end_rel];
            if let Some(item_title) = extract_tag_inner(slice, slice_low, "<title", "</title>")
                .map(|t| strip_tags(&t))
                .filter(|t| !t.is_empty())
            {
                let item_href = slice_low
                    .find("<link")
                    .and_then(|lp| slice_low[lp..].find('>').map(|gt| &slice[lp..lp + gt + 1]))
                    .and_then(|tag| extract_attr(tag, "href"))
                    .or_else(|| {
                        extract_tag_inner(slice, slice_low, "<link", "</link>")
                            .map(|u| strip_tags(&u))
                    });
                if let Some(raw_url) = item_href
                    && let Some(resolved) = resolve_url(base_url, &decode_entities(&raw_url))
                {
                    push_unique_link(&mut links, &mut seen_urls, item_title, resolved);
                }
            }
            ecur = start + end_rel + entry_close.len();
        }
    }

    // Extract clickable HTML <a href="..."> links cleanly
    let mut lcur = 0usize;
    while lcur < cleaned.len() && links.len() < 16 {
        let Some(rel) = lower[lcur..].find("<a") else {
            break;
        };
        let pos = lcur + rel;
        let next_ch = lower.as_bytes().get(pos + 2).copied();
        if !matches!(next_ch, Some(b' ' | b'>' | b'\n' | b'\r' | b'\t')) {
            lcur = pos + 2;
            continue;
        }
        let Some(gt_rel) = lower[pos..].find('>') else {
            break;
        };
        let open_tag = &cleaned[pos..pos + gt_rel + 1];
        let inner_start = pos + gt_rel + 1;
        let Some(end_rel) = lower[inner_start..].find("</a>") else {
            lcur = inner_start;
            continue;
        };
        let label = strip_tags(&cleaned[inner_start..inner_start + end_rel]);
        if let Some(href) = extract_attr(open_tag, "href")
            && let Some(resolved) = resolve_url(base_url, &decode_entities(&href))
        {
            push_unique_link(&mut links, &mut seen_urls, label, resolved);
        }
        lcur = inner_start + end_rel + 4;
    }

    (blocks, links)
}

pub fn extract_readable_page(
    raw_html: &str,
    url: &str,
    offset: usize,
    max_chars: usize,
) -> ReadablePage {
    let cleaned = remove_ignored_blocks(raw_html);
    let lower = cleaned.to_ascii_lowercase();
    let title = extract_tag_inner(&cleaned, &lower, "<title", "</title>")
        .map(|s| strip_tags(&s))
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| extract_host(url));

    let (all_blocks, links) = extract_blocks_and_links(&cleaned, url);

    let full_text: String = all_blocks
        .iter()
        .map(|b| b.text.as_str())
        .collect::<Vec<_>>()
        .join("\n\n");
    let total_chars = full_text.chars().count();
    let safe_offset = offset.min(total_chars);
    let limit = max_chars.clamp(400, 4000);

    let mut page_blocks: Vec<ContentBlock> = Vec::new();
    let mut consumed = 0usize;
    let mut kept = 0usize;
    let mut next_offset = safe_offset;
    let block_count = all_blocks.len();

    for (idx, b) in all_blocks.into_iter().enumerate() {
        let blen = b.text.chars().count();
        let sep = if idx + 1 < block_count { 2 } else { 0 };
        let block_end = consumed + blen;
        if block_end <= safe_offset {
            consumed = block_end + sep;
            continue;
        }
        let skip_inside = safe_offset.saturating_sub(consumed);
        let avail = limit.saturating_sub(kept);
        if avail == 0 {
            break;
        }
        let slice: String = b.text.chars().skip(skip_inside).take(avail).collect();
        let slen = slice.chars().count();
        if slen > 0 {
            kept += slen;
            next_offset = (consumed + skip_inside + slen + sep).min(total_chars);
            page_blocks.push(ContentBlock {
                kind: b.kind,
                text: slice,
            });
        }
        consumed = block_end + sep;
        if kept >= limit {
            break;
        }
    }

    let has_more = next_offset < total_chars;

    ReadablePage {
        url: url.to_string(),
        title,
        host: extract_host(url),
        blocks: page_blocks,
        links,
        offset: safe_offset,
        next_offset,
        has_more,
        total_chars,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_relative_and_protocol_links() {
        let base = "https://zh.wikipedia.org/wiki/Xiaomi";
        assert_eq!(
            resolve_url(base, "/wiki/Beijing"),
            Some("https://zh.wikipedia.org/wiki/Beijing".to_string())
        );
        assert_eq!(
            resolve_url(base, "//example.com/a"),
            Some("https://example.com/a".to_string())
        );
        assert_eq!(
            resolve_url(base, "Lei_Jun"),
            Some("https://zh.wikipedia.org/wiki/Lei_Jun".to_string())
        );
        assert_eq!(resolve_url(base, "#top"), None);
        assert_eq!(resolve_url(base, "javascript:void(0)"), None);
    }

    #[test]
    fn decodes_html_entities_safely() {
        assert_eq!(decode_entities("A &amp; B &lt;3&gt; &#65; &#x4F;"), "A & B <3> A O");
    }

    #[test]
    fn strips_scripts_extracts_title_blocks_and_links() {
        let sample = r#"
          <html><head><title>小米手环 &amp; Vela</title>
          <script>alert('bad script content that should disappear');</script>
          <style>body { color: red; }</style></head>
          <body>
            <h1>小米手环 9 Pro 简介</h1>
            <p>这是轻量级嵌入式系统 <b>Xiaomi Vela</b> 的说明文档，支持快应用开发。</p>
            <p>更多详情请点击 <a href="/wiki/NuttX">Apache NuttX 内核</a> 或 <a href="https://iot.mi.com/">小米IoT平台</a>。</p>
          </body></html>
        "#;
        let page = extract_readable_page(sample, "https://zh.wikipedia.org/wiki/Vela", 0, 2000);
        assert_eq!(page.title, "小米手环 & Vela");
        assert_eq!(page.host, "zh.wikipedia.org");
        assert!(page.blocks.iter().all(|b| !b.text.contains("alert")));
        assert_eq!(page.blocks[0].kind, "h");
        assert_eq!(page.links.len(), 2);
        assert_eq!(page.links[0].url, "https://zh.wikipedia.org/wiki/NuttX");
        assert_eq!(page.links[1].url, "https://iot.mi.com/");
        assert!(!page.has_more);
    }

    #[test]
    fn supports_utf8_pagination() {
        let long_cn = format!("<title>测试翻页</title><p>{}</p>", "中文测试段落".repeat(120));
        let p1 = extract_readable_page(&long_cn, "https://example.com/a", 0, 450);
        assert!(p1.has_more);
        assert!(p1.next_offset > 0);
        let p2 = extract_readable_page(&long_cn, "https://example.com/a", p1.next_offset, 450);
        assert!(p2.offset == p1.next_offset);
        assert!(!p2.blocks.is_empty());
    }

    #[test]
    fn extracts_atom_entry_links_and_filters_nav() {
        let atom = r#"
          <feed>
            <title>科技爱好者周刊</title>
            <entry>
              <title>第 300 期：腕上阅读</title>
              <link rel="alternate" href="https://www.ruanyifeng.com/blog/2026/weekly-300.html"/>
              <summary>这是一段关于轻量嵌入式浏览器的周刊摘要内容。</summary>
            </entry>
          </feed>
        "#;
        let feed_page = extract_readable_page(atom, "https://www.ruanyifeng.com/blog/atom.xml", 0, 1600);
        assert_eq!(feed_page.title, "科技爱好者周刊");
        assert_eq!(feed_page.links.len(), 1);
        assert_eq!(feed_page.links[0].label, "第 300 期：腕上阅读");
        assert_eq!(
            feed_page.links[0].url,
            "https://www.ruanyifeng.com/blog/2026/weekly-300.html"
        );

        let nav_html = format!(
            "<html><title>正文测试</title><body><nav><a href=\"/login\">登录</a></nav><main><p>{}</p><a href=\"/post/1\">阅读全文</a></main></body></html>",
            "这是一段足够长且有信息量的正式文章内容，确保噪声导航栏被过滤掉。".repeat(3)
        );
        let parsed = extract_readable_page(&nav_html, "https://example.com/", 0, 1600);
        assert!(parsed.links.iter().all(|l| l.label != "登录"));
        assert!(parsed.links.iter().any(|l| l.label == "阅读全文"));
    }
}
