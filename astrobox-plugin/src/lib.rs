mod html_reader;

use std::collections::HashSet;
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

use astrobox_ng_wit::astrobox::psys_host::device::{self, DeviceInfo};
use astrobox_ng_wit::astrobox::psys_host::interconnect;
use astrobox_ng_wit::astrobox::psys_host::register;
use astrobox_ng_wit::astrobox::psys_host::thirdpartyapp;
use astrobox_ng_wit::astrobox::psys_host::timer;
use astrobox_ng_wit::astrobox::psys_host::ui_v3::{
    self, Element, ElementType, Event, FlexDirection,
};
use astrobox_ng_wit::exports::astrobox::psys_plugin::event_v3::{EventType, Guest as EventGuest};
use astrobox_ng_wit::exports::astrobox::psys_plugin::lifecycle::Guest as LifecycleGuest;
use serde_json::{Value, json};
use waki::{Client as HttpClient, Method as HttpMethod};

use crate::html_reader::{extract_readable_page, resolve_url};

const PACKAGE_NAME: &str = "io.github.o_o1112.bandbrowser";
const PROTOCOL_VERSION: u64 = 2;
const MAX_HTML_BYTES: usize = 384 * 1024;
const DISCOVERY_RETRY_PAYLOAD: &str = "band-browser-discovery";

struct Plugin;

#[derive(Default)]
struct AppState {
    element_id: Option<String>,
    devices: Vec<DeviceInfo>,
    selected_device: Option<String>,
    registered_addrs: HashSet<String>,
    status: String,
    last_url: String,
    error: Option<String>,
    browse_count: u64,
    busy: bool,
}

static STATE: OnceLock<Mutex<AppState>> = OnceLock::new();

fn state() -> &'static Mutex<AppState> {
    STATE.get_or_init(|| {
        Mutex::new(AppState {
            status: "等待手环浏览器连接...".to_string(),
            last_url: "尚未发起网页请求".to_string(),
            ..Default::default()
        })
    })
}

fn with_state<R>(f: impl FnOnce(&mut AppState) -> R) -> R {
    let mut guard = match state().lock() {
        Ok(g) => g,
        Err(p) => p.into_inner(),
    };
    f(&mut guard)
}

fn render_current() {
    let element_id = with_state(|s| s.element_id.clone());
    if let Some(id) = element_id {
        render(&id);
    }
}

fn label(text: impl Into<String>, color: &str, size: u32) -> Element {
    let text = text.into();
    Element::new(ElementType::P, Some(&text))
        .text_color(color)
        .size(size)
}

fn button(
    text: impl Into<String>,
    event_id: impl Into<String>,
    primary: bool,
    disabled: bool,
) -> Element {
    let text = text.into();
    let mut el = Element::new(ElementType::Button, Some(&text))
        .padding_top(8)
        .padding_bottom(8)
        .padding_left(14)
        .padding_right(14)
        .radius(8)
        .bg(if primary { "#0284C7" } else { "#1E293B" })
        .text_color("#FFFFFF")
        .without_default_styles();
    if !disabled {
        el = el.on(Event::Click, &event_id.into());
    }
    el
}

fn render(element_id: &str) {
    let (devices, selected, status, last_url, error, count, busy) = with_state(|s| {
        (
            s.devices.clone(),
            s.selected_device.clone(),
            s.status.clone(),
            s.last_url.clone(),
            s.error.clone(),
            s.browse_count,
            s.busy,
        )
    });

    let header = Element::new(ElementType::Div, None)
        .flex()
        .flex_direction(FlexDirection::Column)
        .gap(4)
        .child(label("Band Browser 腕上浏览器插件", "#FFFFFF", 18))
        .child(label("内置 WASI HTTP 抓取与 HTML 正文/链接解析，免开电脑代理", "#94A3B8", 12));

    let status_card = Element::new(ElementType::Div, None)
        .flex()
        .flex_direction(FlexDirection::Column)
        .gap(4)
        .padding(10)
        .radius(8)
        .bg("#131C2E")
        .width_full()
        .child(label(format!("状态：{status}"), "#38BDF8", 13))
        .child(label(format!("已抓取页面：{count}"), "#CBD5E1", 12))
        .child(label(format!("最近网址：{last_url}"), "#94A3B8", 12));

    let mut dev_box = Element::new(ElementType::Div, None)
        .flex()
        .flex_direction(FlexDirection::Column)
        .gap(6)
        .width_full()
        .child(label("已连接穿戴设备", "#CBD5E1", 13));

    if devices.is_empty() {
        dev_box = dev_box.child(label("未检测到设备，请先在 AstroBox 连接小米手环 9 Pro", "#64748B", 12));
    } else {
        for (idx, dev) in devices.iter().enumerate() {
            let active = selected.as_deref() == Some(dev.addr.as_str());
            dev_box = dev_box.child(button(
                format!("{} {} ({})", if active { "●" } else { "○" }, dev.name, dev.addr),
                format!("select-device:{idx}"),
                active,
                busy,
            ));
        }
    }

    let actions = Element::new(ElementType::Div, None)
        .flex()
        .flex_direction(FlexDirection::Row)
        .gap(8)
        .width_full()
        .child(button("重新注册通道", "refresh", false, busy).width_full())
        .child(button("启动腕上浏览器", "launch", true, busy || devices.is_empty()).width_full());

    let mut root = Element::new(ElementType::Div, None)
        .flex()
        .flex_direction(FlexDirection::Column)
        .width_full()
        .min_height(320)
        .padding(12)
        .gap(10)
        .bg("#0B1120")
        .text_color("#F8FAFC")
        .child(header)
        .child(status_card)
        .child(dev_box)
        .child(actions);

    if let Some(err) = error {
        root = root.child(
            Element::new(ElementType::Div, Some(&err))
                .padding(10)
                .radius(6)
                .bg("#3B1522")
                .text_color("#FDA4AF")
                .width_full(),
        );
    }
    ui_v3::render(element_id, root);
}

fn hex_nibble(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}

fn decode_hex_utf8(hex: &str) -> Result<String, String> {
    let t = hex.trim();
    if t.len() % 2 != 0 {
        return Err("payloadHex 长度无效".into());
    }
    let bytes = t
        .as_bytes()
        .chunks_exact(2)
        .map(|p| Ok((hex_nibble(p[0]).ok_or("hex")? << 4) | hex_nibble(p[1]).ok_or("hex")?))
        .collect::<Result<Vec<u8>, &str>>()
        .map_err(|_| "payloadHex 解析失败".to_string())?;
    String::from_utf8(bytes).map_err(|_| "payloadHex 非 UTF-8".into())
}

pub fn decode_interconnect_envelope(
    payload: &str,
) -> Result<(Value, Option<String>, Option<String>), String> {
    let outer: Value = serde_json::from_str(payload).map_err(|_| "封包 JSON 无效".to_string())?;
    let addr = outer.get("addr").and_then(Value::as_str).map(str::to_string);
    let pkg = ["pkgName", "packageName", "package"]
        .iter()
        .find_map(|k| outer.get(k).and_then(Value::as_str))
        .map(str::to_string);

    let mut cur = outer;
    for _ in 0..4 {
        if cur.get("v").is_some() && cur.get("type").is_some() {
            return Ok((cur, addr, pkg));
        }
        if let Some(s) = cur.as_str() {
            cur = serde_json::from_str(s).map_err(|_| "内层 JSON 无效".to_string())?;
            continue;
        }
        if let Some(nested) = ["payloadText", "payload", "data"]
            .iter()
            .find_map(|k| cur.get(k).filter(|v| !v.is_null()))
        {
            cur = nested.clone();
            continue;
        }
        if let Some(hex) = cur.get("payloadHex").and_then(Value::as_str) {
            cur = Value::String(decode_hex_utf8(hex)?);
            continue;
        }
        break;
    }
    Err("缺少协议字段".into())
}

fn fetch_and_extract_page(payload: &Value) -> Result<(Value, String), String> {
    let raw_url = payload
        .get("url")
        .and_then(Value::as_str)
        .map(str::trim)
        .ok_or_else(|| "缺少请求网址".to_string())?;
    if raw_url.len() > 1024 || (!raw_url.starts_with("http://") && !raw_url.starts_with("https://")) {
        return Err("网址必须以 http:// 或 https:// 开头".into());
    }
    let offset = payload.get("offset").and_then(Value::as_u64).unwrap_or(0) as usize;
    let max_chars = payload.get("maxChars").and_then(Value::as_u64).unwrap_or(1800) as usize;

    let mut current_url = raw_url.to_string();
    let mut final_body = String::new();
    let mut final_status = 0u16;

    for _hop in 0..4 {
        let resp = HttpClient::new()
            .request(HttpMethod::Get, &current_url)
            .connect_timeout(Duration::from_secs(8))
            .header(
                "User-Agent",
                "Mozilla/5.0 (Linux; Android 13; Band9Pro) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36",
            )
            .header("Accept", "text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.8")
            .header("Accept-Encoding", "identity")
            .send()
            .map_err(|e| format!("网络抓取失败（{current_url}）：{e}"))?;

        let status = resp.status_code();
        if matches!(status, 301 | 302 | 303 | 307 | 308)
            && let Some(loc) = resp.headers().get("location").and_then(|v| v.to_str().ok())
            && let Some(next_url) = resolve_url(&current_url, loc)
        {
            current_url = next_url;
            continue;
        }

        final_status = status;
        let bytes = resp.body().map_err(|e| format!("读取网页响应失败：{e}"))?;
        let capped = if bytes.len() > MAX_HTML_BYTES {
            &bytes[..MAX_HTML_BYTES]
        } else {
            &bytes[..]
        };
        final_body = String::from_utf8_lossy(capped).into_owned();
        break;
    }

    if final_status == 0 {
        return Err("重定向次数过多".into());
    }
    if final_status >= 400 {
        return Err(format!("目标网站返回 HTTP {final_status}"));
    }

    let page = extract_readable_page(&final_body, &current_url, offset, max_chars);
    let summary = format!("{final_status} · {}", page.title);
    let val = serde_json::to_value(page).map_err(|e| format!("序列化失败：{e}"))?;
    Ok((val, summary))
}

async fn send_qaic_with_retry(addr: &str, msg: &str) -> Result<(), String> {
    for attempt in 0..2 {
        if interconnect::send_qaic_message(addr, PACKAGE_NAME, msg).await.is_ok() {
            return Ok(());
        }
        if attempt == 0 {
            let _ = register::register_interconnect_recv(addr, PACKAGE_NAME).await;
        }
    }
    Err("发送至手环失败".into())
}

async fn send_response(addr: &str, id: &str, outcome: Result<(Value, String), String>) {
    let (resp_json, ok_url, err_msg) = match outcome {
        Ok((result, summary)) => (
            json!({ "v": PROTOCOL_VERSION, "type": "response", "id": id, "ok": true, "result": result }).to_string(),
            Some(summary),
            None,
        ),
        Err(err) => (
            json!({ "v": PROTOCOL_VERSION, "type": "response", "id": id, "ok": false, "error": err }).to_string(),
            None,
            Some(err),
        ),
    };
    let send_res = send_qaic_with_retry(addr, &resp_json).await;
    with_state(|s| {
        if let Some(u) = ok_url {
            s.browse_count += 1;
            s.last_url = u;
            s.status = "网页已解析并下发至手环".into();
        }
        s.error = send_res.err().or(err_msg);
    });
    render_current();
}

async fn refresh_and_register(schedule_retry: bool) -> Result<(), String> {
    let devices = device::get_connected_device_list().await;
    let addrs: Vec<String> = devices.iter().map(|d| d.addr.clone()).collect();
    let mut reg_ok = HashSet::new();
    for addr in &addrs {
        if register::register_interconnect_recv(addr, PACKAGE_NAME)
            .await
            .is_ok()
        {
            reg_ok.insert(addr.clone());
        }
    }
    let reg_count = reg_ok.len();
    with_state(|s| {
        s.devices = devices;
        if s.selected_device.as_deref().is_none_or(|sel| !addrs.iter().any(|a| a == sel)) {
            s.selected_device = addrs.first().cloned();
        }
        for addr in reg_ok {
            s.registered_addrs.insert(addr.to_string());
        }
        s.error = None;
        s.status = if s.devices.is_empty() {
            "等待连接手环...".into()
        } else if reg_count > 0 {
            format!("已就绪（{reg_count} 台设备）")
        } else {
            "设备已连接，通道注册失败".into()
        };
    });
    render_current();
    if schedule_retry && addrs.is_empty() {
        let _ = timer::set_timeout(3_000, DISCOVERY_RETRY_PAYLOAD).await;
    }
    Ok(())
}

async fn ensure_registered(addr: &str) {
    let known = with_state(|s| s.registered_addrs.contains(addr));
    if !known && register::register_interconnect_recv(addr, PACKAGE_NAME).await.is_ok() {
        with_state(|s| {
            s.registered_addrs.insert(addr.to_string());
        });
    }
}

async fn process_interconnect_message(raw_payload: &str) -> Result<(), String> {
    let (msg, env_addr, env_pkg) = decode_interconnect_envelope(raw_payload)?;
    if let Some(pkg) = env_pkg.as_deref()
        && pkg != PACKAGE_NAME
    {
        return Ok(());
    }
    if msg.get("v").and_then(Value::as_u64) != Some(PROTOCOL_VERSION) {
        return Ok(());
    }
    if msg.get("type").and_then(Value::as_str) != Some("request") {
        return Ok(());
    }
    let id = msg
        .get("id")
        .and_then(Value::as_str)
        .ok_or_else(|| "请求缺少 id".to_string())?
        .to_string();
    let action = msg.get("action").and_then(Value::as_str).unwrap_or("");
    let addr = match env_addr {
        Some(a) => a,
        None => with_state(|s| s.selected_device.clone())
            .ok_or_else(|| "无法确定目标手环地址".to_string())?,
    };
    ensure_registered(&addr).await;

    if action == "ping" {
        let pong = json!({
            "v": PROTOCOL_VERSION,
            "type": "response",
            "id": id,
            "ok": true,
            "result": { "pong": true, "plugin": "Band Browser Sync" }
        })
        .to_string();
        let _ = send_qaic_with_retry(&addr, &pong).await;
        return Ok(());
    }

    if action == "browse" {
        let payload = msg.get("payload").cloned().unwrap_or_else(|| json!({}));
        let outcome = fetch_and_extract_page(&payload);
        send_response(&addr, &id, outcome).await;
        return Ok(());
    }

    Ok(())
}

async fn launch_watch_app() -> Result<(), String> {
    let addr = with_state(|s| {
        s.selected_device
            .clone()
            .or_else(|| s.devices.first().map(|d| d.addr.clone()))
    })
    .ok_or_else(|| "当前无已连接手环".to_string())?;
    ensure_registered(&addr).await;
    let apps = thirdpartyapp::get_thirdparty_app_list(&addr)
        .await
        .map_err(|_| "获取手环应用列表失败".to_string())?;
    let target = apps
        .iter()
        .find(|a| a.package_name == PACKAGE_NAME)
        .ok_or_else(|| "手环尚未安装《腕上浏览器》(.rpk)".to_string())?;
    thirdpartyapp::launch_qa(&addr, target, "/")
        .await
        .map_err(|_| "无法启动腕上浏览器".to_string())?;
    with_state(|s| {
        s.status = "已在手环启动《腕上浏览器》".into();
        s.error = None;
    });
    render_current();
    Ok(())
}

impl LifecycleGuest for Plugin {
    fn on_load() {
        let _ = state();
        astrobox_ng_wit::spawn(async {
            let _ = refresh_and_register(true).await;
        });
    }
}

impl EventGuest for Plugin {
    fn on_event(
        event_type: EventType,
        event_payload: String,
    ) -> astrobox_ng_wit::FutureReader<String> {
        let (writer, reader) = astrobox_ng_wit::wit_future::new::<String>(String::new);
        let res = astrobox_ng_wit::block_on(async move {
            match event_type {
                EventType::InterconnectMessage => process_interconnect_message(&event_payload).await,
                EventType::DeviceAction => refresh_and_register(true).await,
                EventType::Timer => refresh_and_register(false).await,
                _ => Ok(()),
            }
        });
        if let Err(err) = res {
            with_state(|s| s.error = Some(err));
            render_current();
        }
        astrobox_ng_wit::spawn(async move {
            let _ = writer.write(String::new()).await;
        });
        reader
    }

    fn on_ui_event_v3(
        event_id: String,
        _event: Event,
        _event_payload: String,
    ) -> astrobox_ng_wit::FutureReader<String> {
        let (writer, reader) = astrobox_ng_wit::wit_future::new::<String>(String::new);
        let res = astrobox_ng_wit::block_on(async move {
            if let Some(idx_str) = event_id.strip_prefix("select-device:") {
                if let Ok(idx) = idx_str.parse::<usize>() {
                    with_state(|s| {
                        if let Some(dev) = s.devices.get(idx) {
                            s.selected_device = Some(dev.addr.clone());
                        }
                    });
                }
                refresh_and_register(false).await
            } else if event_id == "refresh" {
                refresh_and_register(false).await
            } else if event_id == "launch" {
                launch_watch_app().await
            } else {
                Ok(())
            }
        });
        if let Err(err) = res {
            with_state(|s| s.error = Some(err));
            render_current();
        }
        astrobox_ng_wit::spawn(async move {
            let _ = writer.write(String::new()).await;
        });
        reader
    }

    fn on_ui_render(element_id: String) -> astrobox_ng_wit::FutureReader<()> {
        let (writer, reader) = astrobox_ng_wit::wit_future::new::<()>(|| ());
        with_state(|s| s.element_id = Some(element_id));
        render_current();
        let res = astrobox_ng_wit::block_on(refresh_and_register(false));
        if let Err(err) = res {
            with_state(|s| s.error = Some(err));
            render_current();
        }
        astrobox_ng_wit::spawn(async move {
            let _ = writer.write(()).await;
        });
        reader
    }

    fn on_card_render(_card_id: String) -> astrobox_ng_wit::FutureReader<()> {
        let (writer, reader) = astrobox_ng_wit::wit_future::new::<()>(|| ());
        astrobox_ng_wit::spawn(async move {
            let _ = writer.write(()).await;
        });
        reader
    }
}

astrobox_ng_wit::export!(Plugin);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_browse_envelope_safely() {
        let inner = json!({
            "v": 2,
            "type": "request",
            "id": "br-1",
            "action": "browse",
            "payload": { "url": "https://zh.wikipedia.org/wiki/Xiaomi", "offset": 0 }
        })
        .to_string();
        let hex: String = inner.as_bytes().iter().map(|b| format!("{b:02x}")).collect();
        let env = json!({
            "addr": "AA:BB:CC:DD",
            "pkgName": PACKAGE_NAME,
            "payloadHex": hex
        })
        .to_string();
        let (msg, addr, pkg) = decode_interconnect_envelope(&env).unwrap();
        assert_eq!(addr.as_deref(), Some("AA:BB:CC:DD"));
        assert_eq!(pkg.as_deref(), Some(PACKAGE_NAME));
        assert_eq!(msg["action"], "browse");
    }
}
