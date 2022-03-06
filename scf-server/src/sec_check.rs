use crate::token::*;
use log::info;
use reqwest::multipart::Part;
use serde::{Serialize, Deserialize};
use anyhow::Result;
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct CheckResult{
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
    pub iv: String
}

/// 审核图片
pub async fn img_sec_check_base64(img:&str) -> Result<bool>{
    let bytes = base64::decode(img)?;
    Ok(img_sec_check(bytes).await?)
}

/// 审核图片
pub async fn img_sec_check(image: Vec<u8>) -> Result<bool>{
    //获取token
    let access_token = get_token().await?;

    let url = format!("https://api.weixin.qq.com/wxa/img_sec_check?access_token={access_token}");

    let client = reqwest::Client::new();

    let form = reqwest::multipart::Form::new();
    let file = Part::bytes(image).file_name("media");
    let form = form.part("media", file);

    let res:CheckResult = client.post(url).multipart(form).send().await?.json().await?;
    
    info!("审查结果:{:?}", res);

    Ok(res.errcode == 0)
}

///审核文本
/// https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/sec-check/security.msgSecCheck.html
/// scene 场景枚举值（1 资料；2 评论；3 论坛；4 社交日志）
/// https://zhidao.baidu.com/question/687447786330732684.html
pub async fn msg_sec_check(content:&str) -> Result<bool>{
    //获取token
    let access_token = get_token().await?;
    // let access_token =  "54_3uAYHm_yK9d9ztmKUkOe4C3Vw98DwP87dnoIQ6pEOJ8dB1ZhDWxZz-yaubaadoey227fO9jo4Q0spEP12VkYy8LX3KSRV_ad-gfM8ANiahv46zDB5TW0pRi-sSMDxABlVvnGnDl5G8D4en5qWCBhADARXW";
    // let access_token = "54_AdeGnPELHl89zZGiBi0S6VnxmkKZGJVI8RgR4-kUlonZEg1CFQMwlkmQhXKFvQH0yL5hZJ8MMTTcQbi-l9E6_hxrtmx-N4_doP4aeouxxebxVSVyAscbJEW24S93FyuXj8abxMSX3TW34oOaGYVhAAATLI";
    let url = format!("https://api.weixin.qq.com/wxa/msg_sec_check?access_token={access_token}");
    
    info!("url={url}");

    let client = reqwest::Client::new();
    
    let res:CheckResult = client.post(url).json(&json!({ "content": content })).send().await?.json().await?;
    
    info!("审查结果:{:?}", res);

    Ok(res.errcode == 0)
}

// pub async fn msg_sec_check(form_data: &FormData, scene: i32, content:&str) -> Result<bool>{

//     if form_data.js_code.is_none() && form_data.openid.is_none(){
//         return Err(anyhow!("缺少参数"));
//     }

//     //获取token
//     let access_token = get_token().await?;

//     //获取用户的OpenID
//     let openid = if form_data.openid.is_some(){
//         form_data.openid.clone().unwrap()
//     }else{
//         jscode2session(form_data.js_code.as_ref().unwrap()).await?.openid
//     };
//     info!("请求msg_sec_check的openid={openid}");

//     let url = format!("https://api.weixin.qq.com/wxa/msg_sec_check?access_token={access_token}");
    
//     info!("url={url}");

//     let client = reqwest::Client::new();
    
//     let res:CheckResult = client.post(url).json(&json!({ "content": content })).send().await?.json().await?;
    
//     info!("审查结果:{:?}", res);

//     Ok(res.errcode == 0)
// }

// https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html
// https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
// https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html
// https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html
// async fn jscode2session1(login: &LoginWx) -> Result<(WxSession, WXUser)>{
//     let url = format!("https://api.weixin.qq.com/sns/jscode2session?appid={}&secret={}&js_code={}&grant_type=authorization_code",
//                     APPID,
//                     APPSECRET,
//                     login.js_code);
//     let resp = reqwest::get(&url).await?.text().await?;
//     debug!("sessionKey请求结果:{:?}", resp);
//     let resp:WxSession = serde_json::from_str(&resp)?;

//     debug!("WxSession: {:?}", resp);
//     let encrypted_data = base64::decode(&login.encrypted_data)?;
//     debug!("encrypted_data={:?}", encrypted_data);
//     //https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html
//     // 解密秘钥
//     let key = base64::decode(&resp.session_key)?;
//     debug!("key={:?}", key);
//     // 向量
//     let iv = base64::decode(&login.iv)?;
//     debug!("iv={:?}", iv);

//     let decrypted_data = aes128_decrypt(&key, &iv, &encrypted_data)?;

//     let wxuser:WXUser = serde_json::from_str(&String::from_utf8(decrypted_data.to_vec())?)?;

//     debug!("jscode2session {:?} {:?}", resp, wxuser);
    
//     Ok((resp, wxuser))
// }

// 使用js_code获取openid和session_key, session_key暂时不用
// async fn jscode2session(js_code: &str) -> Result<WxSession>{
//     let url = format!("https://api.weixin.qq.com/sns/jscode2session?appid={}&secret={}&js_code={}&grant_type=authorization_code",
//                     APPID,
//                     APPSECRET,
//                     js_code);
//     let resp_str = reqwest::get(&url).await?.text().await?;
//     debug!("sessionKey请求结果:{:?}", resp_str);
//     //失败返回: "{\"errcode\":40163,\"errmsg\":\"code been used, rid: 622214f5-5816d01c-0d6420a4\"}"
//     //成功返回: "{\"session_key\":\"kt9I1sFjq7f6U\\/8Zb55U0w==\",\"openid\":\"o0WLE5LBSxRwgtsuke3chkrPGNaQ\"}"

//     let resp:WxSession = serde_json::from_str(&resp_str)
//     .map_err(|_| {
//         anyhow!(resp_str)
//     })?;

//     Ok(resp)
// }