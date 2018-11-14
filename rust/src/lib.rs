#[macro_use]
extern crate stdweb;
extern crate base64;
use base64::{encode, decode};

static GIF:&[u8] = include_bytes!("../test.gif");

#[js_export]
fn test() -> String{
    let decoder = gif::Decoder::new(GIF);
    let reader = decoder.read_info().unwrap();
    let (width, height) = (reader.width(), reader.height());
    format!("test.gif大小:{}x{}", width, height)
}
