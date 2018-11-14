#[macro_use]
extern crate stdweb;
extern crate base64;
#[macro_use]
extern crate lazy_static;
use std::sync::Mutex;
// extern crate image;

lazy_static!{
    static ref IMAGES: Mutex<Vec<u8>> = Mutex::new(vec![]);
}

#[js_export]
fn add(data_str: String) -> String{
    
    // let image_data = base64::decode(&s).unwrap();
    // let dimage = image::load_from_memory(&image_data).unwrap();
    // let image = dimage.to_rgb();
    // let decoder = gif::Decoder::new(GIF);
    // let reader = decoder.read_info().unwrap();
    // let (width, height) = (reader.width(), reader.height());
    // format!("图片大小:{}x{}", image.width(), image.height())
    ""
}

/*
 #[js_export]
fn add(data_str: String) -> String{
    let image_data = base64::decode(&data_str).unwrap();
    let mut decoder = jpeg::Decoder::new(image_data.as_slice());
    let result = decoder.decode();
    //let metadata = decoder.info().unwrap();
    // let decoder = gif::Decoder::new(GIF);
    // let reader = decoder.read_info().unwrap();
    // let (width, height) = (reader.width(), reader.height());
    format!("图片信息{:?} result={:?}", decoder.info(), result)
}
*/