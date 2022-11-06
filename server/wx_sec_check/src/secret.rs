use std::env;
use chrono::Utc;
use http::HeaderMap;
use log::info;
use magic_crypt::{new_magic_crypt, MagicCryptTrait};

pub const APPID: &str = env!("gm_app_id");
pub const APPSECRET: &str = env!("gm_app_key");
pub const SECRET_KEY: &str = env!("gm_secret_key");
pub const SECRET_IV: &str = env!("gm_secret_iv");

pub fn check_secret(headers: &HeaderMap) -> anyhow::Result<()>{
    match headers.get("secret"){
        None => {
            Err(anyhow::anyhow!("no secret!"))
        },
        Some(secret) => {
            // secret: 当前时间戳字符串 -> bytes -> 加密 -> base64
            let secret = secret.to_str()?;
            info!("secret={}", secret);

            let crypt = new_magic_crypt!(SECRET_KEY, 128, SECRET_IV);

            let timestamp_str = crypt.decrypt_base64_to_string(secret)?;
            
            let timestamp:i64 = timestamp_str.parse()?;

            let now = Utc::now().timestamp_millis();

            // 5秒之内
            if (timestamp - now).abs() > 5000{
                return Err(anyhow::anyhow!("secret error! secret={}", secret));
            }

            Ok(())
        }
    }
}