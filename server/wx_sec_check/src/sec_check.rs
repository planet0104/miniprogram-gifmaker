use std::{time::Instant, io::Read};

use crate::{token::*, tools::bytes_to_string};
use anyhow::Result;
use bytes::Bytes;
use log::info;
use multipart::client::lazy::Multipart;
use serde::{Deserialize, Serialize};
use serde_json::json;
#[derive(Debug, Serialize, Deserialize)]
pub struct CheckResult {
    pub(crate) errcode: i32,
    pub(crate) errmsg: String,
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
pub async fn _img_sec_check_base64(img: &str) -> Result<CheckResult> {
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

    let mut form = Multipart::new();
    form.add_stream("media", &*image, Some("media".to_string()), None);
    let mut parpared = form.prepare()?;
    let boundaray = parpared.boundary().to_string();
    let mut form_data = Vec::new();
    parpared.read_to_end(&mut form_data)?;
    let data_bytes = Bytes::from(form_data);
    

    let res = spin_sdk::http::send(
        http::Request::builder()
            .method("POST")
            .uri(url)
            .header("content-type", &format!("multipart/form-data; boundary={boundaray}"))
            .body(Some(data_bytes))?,
    )?;
    let json = bytes_to_string(res.body())?;

    info!("img_sec_check调用耗时: {}ms", now.elapsed().as_millis());

    Ok(serde_json::from_str(&json)?)
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

    let json_data = json!({ "content": content }).to_string();
    let data_bytes = Bytes::from(json_data.as_bytes().to_vec());

    let res = spin_sdk::http::send(
        http::Request::builder()
            .method("POST")
            .uri(url)
            .body(Some(data_bytes))?,
    )?;
    let json = bytes_to_string(res.body())?;

    info!("img_sec_check调用耗时: {}ms", now.elapsed().as_millis());

    Ok(serde_json::from_str(&json)?)
}