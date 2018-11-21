#![deny(warnings)]

#[macro_use]
extern crate stdweb;
extern crate gif;
use gif::{Repeat, SetParameter};
use std::cell::RefCell;
use stdweb::web::ArrayBuffer;

thread_local!{
    static IMAGES: RefCell<Vec<Vec<u8>>> = RefCell::new(vec![]);
}

//添加一张图像数据rgba
fn add(data: Vec<u8>) -> i32 {
    let mut count = -1;
    IMAGES.with(|images| {
        let mut images = images.borrow_mut();
        images.push(data);
        //js!(console.log(new Date(), "wasm: 图片添加完成"));
        count = images.len() as i32;
    });
    count
}

fn count() -> i32 {
    let mut count = -1;
    IMAGES.with(|images| {
        count = images.borrow().len() as i32;
    });
    count
}

fn clear() {
    IMAGES.with(|images| {
        images.borrow_mut().clear();
    });
}

//生成gif
fn create(width: u16, height: u16, fps: u16) -> Vec<u8> {
    let mut file = vec![];
    IMAGES.with(|images| {
        let mut images = images.borrow_mut();
        {
            let mut encoder = gif::Encoder::new(&mut file, width, height, &[]).unwrap();
            encoder.set(Repeat::Infinite).unwrap();
            let total = images.len() as i32;
            let mut count = 0;
            for image in &mut *images {
                //js!(console.log(new Date(), "wasm: create count=", @{count}));
                count += 1;
                js!(worker.postMessage({what:"progress", arg0:@{count}, arg1:@{total}}));
                let mut frame = gif::Frame::from_rgba(width, height, image);
                frame.delay = 1000 / fps / 10; //设置帧率 10ms倍数
                encoder.write_frame(&frame).unwrap();
                //js!(console.log(new Date(), "wasm: create count=", @{count}, "帧添加完成."));
            }
        }
        //let size = file.len() as i32;
        //js!(console.log(new Date(), "wasm: create>10 文件大小:", @{size}));
    });
    file
}

#[allow(clippy::needless_pass_by_value)]
fn on_message(what: String, data: ArrayBuffer, width: u16, height: u16, fps: u16) {
    let what = what.as_str();
    match what {
        "add" => {
            let count = add(data.into());
            js!{ worker.postMessage({what:"add", obj: @{count}}) }
        }
        "clear" => {
            clear();
            js!{ worker.postMessage({what:"clear"}) }
        }
        "create" => {
            let img = create(width, height, fps);
            js!{ worker.postMessage({what:"create", obj:@{img}}) }
        }
        "count" => {
            let c = count();
            js!{ worker.postMessage({what:"count", obj:@{c}}) }
        }
        _ => (),
    }
}

fn main() {
    stdweb::initialize();
    let handle = |msg, data, width, height, fps| {
        on_message(msg, data, width, height, fps);
    };
    js! {
        var handle = @{handle};
        worker.onMessage(function(msg){
            console.log("线程收到消息:", msg);
            handle(msg.what, msg.data, msg.width, msg.height, msg.fps);
        });
        console.log("线程准备完毕.");
        worker.postMessage("init");
    }
    stdweb::event_loop();
}
