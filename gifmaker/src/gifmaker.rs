use std::sync::{Arc, Mutex};
use std::io::{self, Write, IoSlice};
use anyhow::{anyhow, Result};
use gif::*;
use crate::js::*;

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
    pub fn new(width: u16, height: u16, fps: u16) -> Result<GifMaker>{
        log(&format!("GifMaker new: width={} height={} fps={}", width, height, fps));
        let data = MyData{data: Arc::new(Mutex::new(vec![])) };
        let mut encoder = Encoder::new(data.clone(), width, height, &[])?;
        encoder.set_repeat(Repeat::Infinite)?;
        Ok(GifMaker{
            data,
            encoder,
            fps,
            width,
            height
        })
    }

    // pub fn get_width(&self) -> u16{
    //     self.width
    // }

    // pub fn get_height(&self) -> u16{
    //     self.height
    // }

    pub fn add_png(&mut self, file:&[u8]) -> Result<()>{
        let decoder = png::Decoder::new(file);
        let mut reader = decoder.read_info()?;
        let mut buf = vec![0; reader.output_buffer_size()];
        reader.next_frame(&mut buf)?;
        let mut frame = gif::Frame::from_rgba_speed(self.width, self.height, &mut buf, 30);
        frame.delay = 1000 / self.fps / 10; //设置帧率 10ms倍数
        self.encoder.write_frame(&frame)?;

        Ok(())
    }

    pub fn get_file(&mut self) -> Result<Vec<u8>>{
        match self.data.data.lock(){
            Ok(data) => Ok(data.clone()),
            Err(err) => Err(anyhow!("{:?}", err))
        }
    }
}