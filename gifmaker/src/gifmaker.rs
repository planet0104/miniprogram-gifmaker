use super::encoder::{Repeat, SetParameter, Encoder};
use super::emscripten::console_log;

pub struct GifMaker{
    encoder: Encoder,
    fps: u16,
    width: u16,
    height: u16,
}

impl GifMaker{
    pub fn new(width: u16, height: u16, fps: u16) -> std::io::Result<GifMaker>{
        console_log(&format!("GifMaker new: width={} height={} fps={}", width, height, fps));
        let mut encoder = Encoder::new(vec![], width, height, &[])?;
        encoder.set(Repeat::Infinite)?;
        Ok(GifMaker{
            encoder,
            fps,
            width,
            height
        })
    }

    pub fn get_width(&self) -> u16{
        self.width
    }

    pub fn get_height(&self) -> u16{
        self.height
    }

    pub fn add_png(&mut self, file:&[u8]) -> std::io::Result<()>{
        let decoder = png::Decoder::new(file);
        let (info, mut reader) = decoder.read_info()?;
        let mut buf = vec![0; info.buffer_size()];
        reader.next_frame(&mut buf)?;
        let mut frame = gif::Frame::from_rgba(self.width, self.height, &mut buf);
        frame.delay = 1000 / self.fps / 10; //设置帧率 10ms倍数
        self.encoder.write_frame(&frame)
    }

    pub fn get_file(&mut self) -> Vec<u8>{
        self.encoder.get_file().clone()
    }
}