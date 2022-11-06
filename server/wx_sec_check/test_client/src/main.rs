use chrono::Local;
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

    let client = reqwest::Client::new();
    
    let current_time = Local::now().timestamp_millis();

    println!("current_time={current_time}");

    let crypt = new_magic_crypt!(SECRET_KEY, 128, SECRET_IV);

    let encrypted_time_str = crypt.encrypt_str_to_base64(format!("{current_time}"));

    println!("encrypted_time_str={encrypted_time_str}");

    // let server = "http://127.0.0.1:3000/";
    let server = "https://www.ccfish.run/serverless/";

    let mut headers = HeaderMap::new();
    headers.append("secret", HeaderValue::from_str(&encrypted_time_str)?);

    let img = include_bytes!("../test.png").to_vec();

    let res:Value = client
    .post(format!("{server}wx-sec-check?type=img"))
        .headers(headers.clone())
        .body(Body::from(img))
        .send()
        .await?
        .json()
        .await?;

    println!("图片审查结果:{:?}", res);

    let msg = "hello!";

    let res:Value = client
        .post(format!("{server}wx-sec-check?type=msg"))
        .headers(headers)
        .body(msg)
        .send()
        .await?
        .json()
        .await?;

    println!("文字审查结果:{:?}", res);

    Ok(())
}