use std::{sync::{Mutex, MutexGuard}};
use js_sys::*;
use once_cell::sync::Lazy;
use wasm_bindgen::prelude::*;
mod js;
mod gifmaker;
use js::*;
use gifmaker::*;

static GIFMAKER: Lazy<Mutex<Option<GifMaker>>> = Lazy::new(|| {
    Mutex::new(None)
});

fn lock() -> Result<MutexGuard<'static, Option<gifmaker::GifMaker>>, wasm_bindgen::JsValue>{
    match GIFMAKER.lock(){
        Ok(gifmaker) => {
            Ok(gifmaker)
        }
        Err(err) => Err(JsValue::from(format!("{:?}", err)))
    }
}

/// 初始化Gif编码器
#[wasm_bindgen(js_name = create)]
pub fn create(width: u16, height: u16, fps: u16) -> Result<(), JsValue>{
    log("开始创建Gifmaker");
    let mut gifmaker = lock()?;
    match GifMaker::new(width, height, fps){
        Ok(mk) => {
            gifmaker.replace(mk);
            log("Gifmaker创建完成");
            Ok(())
        }
        Err(err) => Err(JsValue::from(format!("{:?}", err))),
    }
}

/// 添加图片(png文件)
#[wasm_bindgen(js_name = addPng)]
pub fn add_png(src: Uint8ClampedArray) -> Result<(), JsValue>{
    let mut gifmaker = lock()?;
    match gifmaker.as_mut(){
        Some(gifmaker) => {
            if let Err(err) = gifmaker.add_png(&src.to_vec()){
                Err(JsValue::from(format!("{:?}", err)))
            }else{
                Ok(())
            }
        }
        None => Err(JsValue::from("请先创建GifMaker"))
    }
}

/// 生成gif
#[wasm_bindgen(js_name = getFile)]
pub fn get_file() -> Result<Uint8ClampedArray, JsValue>{
    let mut gifmaker = lock()?;
    match gifmaker.as_mut(){
        Some(gifmaker) => {
            match gifmaker.get_file(){
                Ok(file) => {
                    let arr = Uint8ClampedArray::new_with_length(file.len() as u32);
                    arr.copy_from(&file);
                    Ok(arr)
                }
                Err(err) => Err(JsValue::from(format!("{:?}", err)))
            }
        }
        None => Err(JsValue::from("请先创建GifMaker"))
    }
}

//API网关绑定的密钥对
const SECRET_ID: &str = env!("gifmaker_SecretId");
const SECRET_KEY: &str = env!("gifmaker_SecretKey");

/// 生成验证API网关的密钥Header
#[wasm_bindgen(js_name = generateHeaders)]
pub fn generate_headers() -> Result<Object, JsValue>{

    let date_time = Date::new_0().to_utc_string().as_string().unwrap_or("".to_string());

    let source = "gifmaker";
    let auth = format!(
        "hmac id=\"{SECRET_ID}\", algorithm=\"hmac-sha1\", headers=\"x-date source\", signature=\""
    );
    let sign_str = format!("x-date: {date_time}\nsource: {source}");

    println!("auth={auth}");
    println!("sign_str={sign_str}");

    let sign = hmacsha1::hmac_sha1(SECRET_KEY.as_bytes(), sign_str.as_bytes());
    let sign = base64::encode(sign);
    println!("sign={sign}");
    let sign = format!("{auth}{sign}\"");

    println!("Authorization={sign}");

    let map = Map::new();
    map.set(&JsValue::from_str("Source"), &JsValue::from_str(source));
    map.set(&JsValue::from_str("X-Date"), &JsValue::from_str(&date_time.to_string()));
    map.set(&JsValue::from_str("Authorization"), &JsValue::from_str(&sign));

    Ok(Object::from_entries(&map)?)
}

#[wasm_bindgen(start)]
pub fn run() {
    log("start");
}