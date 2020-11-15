// use super::encoder::{Repeat, SetParameter, Encoder};
use super::emscripten::console_log;
use gif::*;
use std::sync::RwLock;
use std::rc::Rc;
use std::sync::{Arc, Mutex};
use std::io::Write;
use std::io::Cursor;
use std::io::{self, IoSlice};

struct MyData{
    data: Arc<Mutex<Vec<u8>>>,
}

impl Clone for MyData{
    fn clone(&self) -> Self {
        MyData{
            data: self.data.clone()
        }
    }
}

impl Write for MyData{
    #[inline]
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.data.lock().unwrap().extend_from_slice(buf);
        Ok(buf.len())
    }

    #[inline]
    fn write_vectored(&mut self, bufs: &[IoSlice<'_>]) -> io::Result<usize> {
        let len = bufs.iter().map(|b| b.len()).sum();
        let mut _self = self.data.lock().unwrap();
        _self.reserve(len);
        for buf in bufs {
            _self.extend_from_slice(buf);
        }
        Ok(len)
    }

    #[inline]
    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

pub struct GifMaker{
    //最终生成的文件数据
    data: MyData,
    // Encoder
    encoder: Encoder<MyData>,
    fps: u16,
    width: u16,
    height: u16,
}

impl GifMaker{
    pub fn new(width: u16, height: u16, fps: u16) -> GifMaker{
        console_log(&format!("GifMaker new: width={} height={} fps={}", width, height, fps));
        let data = MyData{data: Arc::new(Mutex::new(vec![])) };
        let mut encoder = Encoder::new(data.clone(), width, height, &[]).unwrap();
        // encoder.set_repeat(Repeat::Infinite).unwrap();
        encoder.set(Repeat::Infinite);
        GifMaker{
            data,
            encoder,
            fps,
            width,
            height
        }
    }

    pub fn get_width(&self) -> u16{
        self.width
    }

    pub fn get_height(&self) -> u16{
        self.height
    }

    pub fn add_png(&mut self, file:&[u8]){
        let decoder = png::Decoder::new(file);
        let (info, mut reader) = decoder.read_info().unwrap();
        let mut buf = vec![0; info.buffer_size()];
        reader.next_frame(&mut buf).unwrap();
        let mut frame = gif::Frame::from_rgba_speed(self.width, self.height, &mut buf, 30);
        frame.delay = 1000 / self.fps / 10; //设置帧率 10ms倍数
        self.encoder.write_frame(&frame).unwrap();
    }

    pub fn get_file(&mut self) -> Vec<u8>{
        let d = self.data.data.lock().unwrap();
        d.clone()
    }
}