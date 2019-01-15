#![recursion_limit="128"]

#[macro_use]
extern crate stdweb;
use gif::{Repeat, SetParameter};
use stdweb::unstable::TryInto;
use stdweb::web::ArrayBuffer;

//生成gif
fn create(total: usize, width: u16, height: u16, fps: u16){
    //创建gif编码器
    let mut file = vec![];
    {
        let mut encoder = gif::Encoder::new(&mut file, width, height, &[]).unwrap();
        encoder.set(Repeat::Infinite).unwrap();

        for i in 0..total {
            match js! {
                var filePath = getApp().globalData.userDataPath + "gen"+@{i as i32}+".png";
                console.log("读取图片:", filePath);
                try{
                    var result = wx.getFileSystemManager().readFileSync(filePath);
                    return result;
                }catch(e){
                    console.log("图片读取失败：", e);
                    return null;
                }
            } {
                stdweb::Value::Reference(n) => {
                    js! {
                        wx.showLoading({
                            title: "GIF制作中(" + @{i as i32} + "/" + @{total as i32} + ")",
                            mask: true,
                        });
                    };
                    let buffer: ArrayBuffer = n.try_into().unwrap();
                    let buffer = Vec::from(buffer);
                    let decoder = png::Decoder::new(buffer.as_slice());
                    let (info, mut reader) = decoder.read_info().unwrap();
                    let mut buf = vec![0; info.buffer_size()];
                    reader.next_frame(&mut buf).unwrap();

                    let mut frame = gif::Frame::from_rgba(width, height, &mut buf);
                    frame.delay = 1000 / fps / 10; //设置帧率 10ms倍数
                    encoder.write_frame(&frame).unwrap();
                }
                _ => {
                    break;
                }
            }
        }
    }
    js!{
        getApp().gifHelper.gif = @{file};
    };
}

fn main() {
    stdweb::initialize();

    js!({
        var gifHelper = {};
        gifHelper.create = @{create};
        getApp().gifHelper = gifHelper;
    });
    stdweb::event_loop();
}
