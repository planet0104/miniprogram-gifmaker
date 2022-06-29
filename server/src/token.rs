use crate::constant::{APPID, APPSECRET};
use anyhow::{anyhow, Result};
use chrono::prelude::*;
use log::info;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

static TOKEN: Lazy<Mutex<Option<Token>>> = Lazy::new(|| Mutex::new(None));

#[derive(Serialize, Deserialize)]
pub struct Token {
    access_token: String,
    expires_in: i64,
    #[serde(default = "default_create_time")]
    create_time: i64,
}

impl Token {
    fn is_expired(&self) -> bool {
        //秒
        let now = Local::now().timestamp();
        //提前一分钟刷新token
        let expires_in = self.create_time + self.expires_in - 60;
        now > expires_in
    }
}

fn default_create_time() -> i64 {
    Local::now().timestamp()
}

//获取可用的token
pub async fn get_token() -> Result<String> {
    match TOKEN.lock() {
        Err(err) => Err(anyhow!("{:?}", err)),
        Ok(mut token) => {
            if token.is_none() {
                token.replace(request_token().await?);
            }

            if token.as_ref().unwrap().is_expired() {
                token.replace(request_token().await?);
            }

            let token = token.as_ref().unwrap();

            Ok(token.access_token.clone())
        }
    }
}

//刷新token
pub async fn _refresh_token() -> Result<String> {
    match TOKEN.lock() {
        Err(err) => Err(anyhow!("{:?}", err)),
        Ok(mut token) => {
            token.replace(request_token().await?);
            let token = token.as_mut().unwrap();
            Ok(token.access_token.clone())
        }
    }
}

pub async fn request_token() -> Result<Token> {
    info!("request_token");
    Ok(reqwest::get(format!("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APPID}&secret={APPSECRET}")).await?.json().await?)
}
