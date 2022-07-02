use anyhow::Result;
mod middleware;
// mod aes_cbc;
mod sec_check;
mod constant;
mod token;
use actix_web::{error, post, web, App, Error, HttpResponse, HttpServer, get};
use chrono::{Utc, Local};
use config::Config;
use futures_util::StreamExt;
use log::info;
use serde::{Serialize, Deserialize};
use serde_json::json;
use simple_log::LogConfigBuilder;

const MAX_SIZE: usize = 1024 * 1024 * 5; // 最大5M

#[post("/img_sec_check")]
async fn img_sec_check(mut payload: web::Payload) -> Result<HttpResponse, Error> {
    let mut body = web::BytesMut::new();

    while let Some(chunk) = payload.next().await {
        let chunk = chunk?;
        // limit max size of in-memory payload
        if (body.len() + chunk.len()) > MAX_SIZE {
            return Err(error::ErrorBadRequest("payload overflow, max size 5M."));
        }
        body.extend_from_slice(&chunk);
    }

    let image_data = body.to_vec();
    let image_data_len = image_data.len();
    
    let res = sec_check::img_sec_check(image_data)
        .await
        .map_err(|err| error::ErrorBadRequest(format!("{err}")))?;

    info!("img_sec_check {:?} 图像大小:{}K", res, image_data_len/1024);

    Ok(HttpResponse::Ok().json(res))
}

#[post("/msg_sec_check")]
async fn msg_sec_check(msg: String) -> Result<HttpResponse, Error> {
    let res = sec_check::msg_sec_check(&msg)
        .await
        .map_err(|err| error::ErrorBadRequest(format!("{err}")))?;

    let msg_len = msg.len();
    info!("msg_sec_check 文本长度:{msg_len}  文本内容:{msg} {:?}", res);

    Ok(HttpResponse::Ok().json(res))
}

#[post("/img_sec_check_base64")]
async fn img_sec_check_base64(file_base64: String) -> Result<HttpResponse, Error> {
    let res = sec_check::img_sec_check_base64(&file_base64)
        .await
        .map_err(|err| error::ErrorBadRequest(format!("{err}")))?;

    Ok(HttpResponse::Ok().json(res))
}

#[get("/server_utc_now")]
async fn server_utc_now() -> Result<HttpResponse, Error> {
    let now = Utc::now();
    info!("server_utc_now: {:?} 本地时间:{}", now, Local::now());
    let now_timestamp = now.timestamp_millis();
    Ok(HttpResponse::Ok().json(json!(now_timestamp)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Settings{
    ip: String,
    port: u16,
    scope: String,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // env_logger::Builder::new().filter_level(LevelFilter::Info).init();

    let config = LogConfigBuilder::builder()
        .path("./gifmaker.log")
        .size(1 * 100)
        .roll_count(10)
        .time_format("%Y-%m-%d %H:%M:%S.%f") //E.g:%H:%M:%S.%f
        .level("info")
        .output_file()
        .output_console()
        .build();

    simple_log::new(config).unwrap();

    info!("read Settings.toml...");

    let config = Config::builder().add_source(config::File::with_name("Settings")).build().unwrap();
    let settings: Settings = config.try_deserialize().unwrap();

    info!("{:?}", settings);

    let ip = settings.ip;
    let port = settings.port;
    let scope = settings.scope;

    info!("start scf-server...");

    HttpServer::new(move || App::new()
        .wrap(middleware::Authentication)
            .service(
                web::scope(&scope)
                .service(msg_sec_check)
                .service(img_sec_check)
                .service(img_sec_check_base64)
                .service(server_utc_now)
            )
        )
        .bind((ip, port))?
        .run()
        .await
}