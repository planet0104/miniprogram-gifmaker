#[macro_use]
extern crate stdweb;
extern crate base64;
extern crate png;
#[macro_use]
extern crate lazy_static;
use std::sync::Mutex;
extern crate gif;

lazy_static!{
    static ref IMAGES: Mutex<Vec<Vec<u8>>> = Mutex::new(vec![]);
}

//添加一张png
#[js_export]
fn add(data:String) -> i32{
    let image_data = base64::decode(&data).unwrap();
    let mut images = IMAGES.lock().unwrap();
    images.push(image_data);
    images.len() as i32
}

#[js_export]
fn count() -> i32{
    IMAGES.lock().unwrap().len() as i32
}

#[js_export]
fn clear(){
    IMAGES.lock().unwrap().clear();
}

//生成gif
#[js_export]
fn create(width:u16, height:u16, fps: u16) -> String{
    let images = IMAGES.lock().unwrap();
    let mut file = vec![];
    {
        let mut encoder = gif::Encoder::new(&mut file, width, height, &[]).unwrap();
        for image in &*images{
            let decoder = png::Decoder::new(image.as_slice());
            let (info, mut reader) = decoder.read_info().unwrap();
            let mut buf = vec![0; info.buffer_size()];
            reader.next_frame(&mut buf).unwrap();
            let mut frame = gif::Frame::from_rgba(width, height, &mut buf);
            frame.delay = 1000/fps/10; //设置帧率 10ms倍数
            encoder.write_frame(&frame).unwrap();
        }
    }
    base64::encode(&file)
}