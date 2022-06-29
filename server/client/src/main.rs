use chrono::Utc;
use magic_crypt::{new_magic_crypt, MagicCryptTrait};
use reqwest::{header::{HeaderMap, HeaderValue}, Body};
use anyhow::Result;
use serde_json::Value;

const SECRET_KEY: &str = env!("gm_secret_key");
const SECRET_IV: &str = env!("gm_secret_iv");

#[tokio::main]
async fn main() -> Result<()> {
    println!("SECRET_KEY={SECRET_KEY}");
    println!("SECRET_IV={SECRET_IV}");

    let crypt = new_magic_crypt!(SECRET_KEY, 128, SECRET_IV);
    
    let current_time = format!("{}", Utc::now().timestamp_millis());

    let encrypted_time_str = crypt.encrypt_str_to_base64(current_time);

    println!("encrypted_time_str={encrypted_time_str}");

    let mut headers = HeaderMap::new();
    headers.append("secret", HeaderValue::from_str(&encrypted_time_str)?);

    let client = reqwest::Client::new();

    let img = include_bytes!("../test.png").to_vec();

    let res:Value = client
        .post("http://www.ccfish.run:9990/img_sec_check")
        .headers(headers.clone())
        .body(Body::from(img))
        .send()
        .await?
        .json()
        .await?;

    println!("图片审查结果:{:?}", res);

    let msg = "hello!";

    let res:Value = client
        .post("http://www.ccfish.run:9990/msg_sec_check")
        .headers(headers)
        .body(msg)
        .send()
        .await?
        .json()
        .await?;

    println!("文字审查结果:{:?}", res);

    Ok(())
}