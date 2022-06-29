use std::{sync::{Mutex, MutexGuard}};
use js_sys::*;
use magic_crypt::{new_magic_crypt, MagicCryptTrait};
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

const SECRET_KEY: &str = env!("gm_secret_key");
const SECRET_IV: &str = env!("gm_secret_iv");
pub const APPID: &str = env!("gm_app_id");

/// 生成验证API网关的密钥Header
#[wasm_bindgen(js_name = generateHeaders)]
pub fn generate_headers(mut timestamp: f64) -> Result<Object, JsValue>{
    // log(&format!("generate_headers>> timestamp={timestamp}"));

    // 这段代码编译时请删除
    include_str!("../gm_check_code.rs");

    let crypt = new_magic_crypt!(SECRET_KEY, 128, SECRET_IV);
    
    let current_time = format!("{}", timestamp as i64);

    let encrypted_time_str = crypt.encrypt_str_to_base64(current_time);

    // log(&format!("encrypted_time_str={encrypted_time_str}"));

    let map = Map::new();
    map.set(&JsValue::from_str("secret"), &JsValue::from_str(&encrypted_time_str));

    Ok(Object::from_entries(&map)?)
}

#[wasm_bindgen(start)]
pub fn run() {
    log("start");
}