#[macro_use]
extern crate stdweb;
extern crate base64;
extern crate png;
#[macro_use]
extern crate lazy_static;
use std::sync::Mutex;
extern crate gif;
use gif::{Repeat, SetParameter};

lazy_static!{
    static ref IMAGES: Mutex<Vec<Vec<u8>>> = Mutex::new(vec![]);
}

//添加一张png
#[js_export]
fn add(data:String) -> i32{
    match base64::decode(&data){
        Ok(image_data) => {
            js!(console.log(new Date(), "wasm: 开始添加图片"));
            let mut images = IMAGES.lock().unwrap();
            images.push(image_data);
            js!(console.log(new Date(), "wasm: 图片添加完成"));
            images.len() as i32
        },
        Err(err) => {
            let err_str =format!("{:?}", err);
            js!(console.log(new Date(), "wasm: base64解码失败!", @{err_str}));
            -1
        }
    }
}

#[js_export]
fn count() -> i32{
    js!(console.log(new Date(), "wasm: count"));
    IMAGES.lock().unwrap().len() as i32
}

#[js_export]
fn clear(){
    js!(console.log(new Date(), "wasm: clear"));
    IMAGES.lock().unwrap().clear();
}

//生成gif
#[js_export]
fn create(width:u16, height:u16, fps: u16) -> String{
    js!(console.log(new Date(), "wasm: create>01"));
    let images = IMAGES.lock().unwrap();
    let mut file = vec![];
    js!(console.log(new Date(), "wasm: create>02"));
    {
        let mut encoder = gif::Encoder::new(&mut file, width, height, &[]).unwrap();
        js!(console.log(new Date(), "wasm: create>03"));
        encoder.set(Repeat::Infinite).unwrap();
        js!(console.log(new Date(), "wasm: create>04"));
        let mut count = 0i32;
        let total = images.len() as i32;
        for image in &*images{
            js!(console.log(new Date(), "wasm: create count=", @{count}));
            count += 1;
            js!{
                wx.showLoading({
                    title: "GIF制作中(" + @{count} + "/" + @{total} + ")",
                    mask: true,
                });
            };
            let decoder = png::Decoder::new(image.as_slice());
            let (info, mut reader) = decoder.read_info().unwrap();
            let mut buf = vec![0; info.buffer_size()];
            reader.next_frame(&mut buf).unwrap();
            let mut frame = gif::Frame::from_rgba(width, height, &mut buf);
            frame.delay = 1000/fps/10; //设置帧率 10ms倍数
            encoder.write_frame(&frame).unwrap();
            js!(console.log(new Date(), "wasm: create count=", @{count}, "帧添加完成."));
        }
    }
    let size = file.len() as i32;
    js!(console.log(new Date(), "wasm: create>10 文件大小:", @{size}));
    let base = base64::encode(&file);
    js!(console.log(new Date(), "wasm: base.len()=", @{base.len() as i32}));
    base
}