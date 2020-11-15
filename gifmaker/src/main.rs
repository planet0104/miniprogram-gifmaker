mod emscripten;
mod gifmaker;
// mod encoder;
use gifmaker::*;
use emscripten::*;
// use std::cell::RefCell;
use once_cell::sync::Lazy;
use std::sync::Mutex;

// thread_local! {
//     pub static GIFMAKER: RefCell<Option<GifMaker>> = RefCell::new(None);
// }

static GIFMAKER: Lazy<Mutex<Option<GifMaker>>> = Lazy::new(|| {
    Mutex::new(None)
});

/// 初始化Gif编码器
#[no_mangle]
fn create(width: u16, height: u16, fps: u16){
    console_log("开始创建Gifmaker");
    *GIFMAKER.lock().unwrap() = Some(GifMaker::new(width, height, fps)); 
    console_log("Gifmaker创建完成");
    // GIFMAKER.with(|gifmaker|{
    //     // match GifMaker::new(width, height, fps){
    //     //     Ok(m) => *gifmaker.borrow_mut() = Some(m),
    //     //     Err(err) => console_error(&format!("GifMaker创建失败:{:?}", err))
    //     // };
    //     *gifmaker.borrow_mut() = Some(GifMaker::new(width, height, fps));
    // });
}

/// 添加图片(png文件)
#[no_mangle]
fn add_png(buffer: *mut u8, buf_len: i32){
    if let Some(gifmaker) = GIFMAKER.lock().unwrap().as_mut(){
        let file: Vec<u8> = unsafe { Vec::from_raw_parts(buffer, buf_len as usize, buf_len as usize) };
        // match gifmaker.add_png(&file){
        //     Ok(()) => console_log("png添加成功"),
        //     Err(err) => console_error(&format!("png添加失败:{}", err))
        // };
        gifmaker.add_png(&file);
    }else{
        console_error("请先创建GifMaker");
    }
    // GIFMAKER.with(|gifmaker|{
    //     match gifmaker.borrow_mut().as_mut(){
    //         Some(gifmaker) => {
    //             let file: Vec<u8> = unsafe { Vec::from_raw_parts(buffer, buf_len as usize, buf_len as usize) };
    //             // match gifmaker.add_png(&file){
    //             //     Ok(()) => console_log("png添加成功"),
    //             //     Err(err) => console_error(&format!("png添加失败:{}", err))
    //             // };
    //             gifmaker.add_png(&file);
    //         }
    //         None => {
    //             console_error("请先创建GifMaker");
    //         }
    //     };
    // });
}

/// 生成gif
#[no_mangle]
fn get_file(){
    // GIFMAKER.with(|gifmaker|{
    //     match gifmaker.borrow_mut().as_mut(){
    //         Some(gifmaker) => {
    //             let file = gifmaker.get_file();
    //             //将指针存储到Module中，在Module.GifMaker的getFile js方法中获取
    //             let len = file.len();
    //             let ptr = file.as_ptr();
    //             std::mem::forget(file);
    //             set_module_field_json(
    //                 "gifFile",
    //                 &format!(
    //                     r#"{{
    //                 "dataLen": {},
    //                 "dataPtr": {}
    //                 }}"#,
    //                     len, ptr as i64
    //                 ),
    //             );
    //         }
    //         None => {
    //             console_error("请先创建GifMaker");
    //         }
    //     }
    // })
    if let Some(gifmaker) = GIFMAKER.lock().unwrap().as_mut(){
        let file = gifmaker.get_file();
        //将指针存储到Module中，在Module.GifMaker的getFile js方法中获取
        let len = file.len();
        let ptr = file.as_ptr();
        std::mem::forget(file);
        set_module_field_json(
            "gifFile",
            &format!(
                r#"{{
            "dataLen": {},
            "dataPtr": {}
            }}"#,
                len, ptr as i64
            ),
        );
    }else{
        console_error("请先创建GifMaker");
    }
}

fn main(){
    init();
}