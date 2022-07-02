use std::time::Instant;

use crate::token::*;
use anyhow::Result;
use log::info;
use reqwest::multipart::Part;
use serde::{Deserialize, Serialize};
use serde_json::json;
#[derive(Debug, Serialize, Deserialize)]
pub struct CheckResult {
    errcode: i32,
    errmsg: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WXUser {
    pub openid: String,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct WxSession {
    pub openid: String,
    pub session_key: String,
}
/// FormData
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormData {
    pub js_code: Option<String>,
    pub openid: Option<String>,
}

/// 小程序登陆
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginWx {
    pub js_code: String,
    pub encrypted_data: String,
    pub iv: String,
}

/// 审核图片
pub async fn img_sec_check_base64(img: &str) -> Result<CheckResult> {
    let bytes = base64::decode(img)?;
    Ok(img_sec_check(bytes).await?)
}

/// 审核图片
pub async fn img_sec_check(image: Vec<u8>) -> Result<CheckResult> {
    //获取token
    let access_token = get_token().await?;

    let url = format!("https://api.weixin.qq.com/wxa/img_sec_check?access_token={access_token}");

    info!("img_sec_check url={url}");
    let now = Instant::now();

    let client = reqwest::Client::new();

    let form = reqwest::multipart::Form::new();
    let file = Part::bytes(image).file_name("media");
    let form = form.part("media", file);

    let res: CheckResult = client
        .post(url)
        .multipart(form)
        .send()
        .await?
        .json()
        .await?;

    info!("img_sec_check调用耗时: {}ms", now.elapsed().as_millis());

    Ok(res)
}

///审核文本
/// https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/sec-check/security.msgSecCheck.html
/// scene 场景枚举值（1 资料；2 评论；3 论坛；4 社交日志）
/// https://zhidao.baidu.com/question/687447786330732684.html
pub async fn msg_sec_check(content: &str) -> Result<CheckResult> {
    //获取token
    let access_token = get_token().await?;

    let url = format!("https://api.weixin.qq.com/wxa/msg_sec_check?access_token={access_token}");

    info!("msg_sec_check url={url}");

    let now = Instant::now();

    let client = reqwest::Client::new();

    let res: CheckResult = client
        .post(url)
        .json(&json!({ "content": content }))
        .send()
        .await?
        .json()
        .await?;
    
    info!("msg_sec_check调用耗时: {}ms", now.elapsed().as_millis());
    Ok(res)
}