use anyhow::Result;
use chrono::{Utc, Local};
use serde_json::json;
use spin_sdk::{
    http::{Request, Response},
    http_component,
};

#[http_component]
fn server_utc_now(_req: Request) -> Result<Response> {
    let now = Utc::now();
    println!("server_utc_now: {:?} 本地时间:{}", now, Local::now());
    let now_timestamp = now.timestamp_millis();
    let res = json!(now_timestamp);
    let res_data = serde_json::to_string(&res)?;
    Ok(http::Response::builder()
    .status(200)
    .body(Some(res_data.into()))?)
}