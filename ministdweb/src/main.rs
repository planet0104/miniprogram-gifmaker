#[macro_use]
extern crate stdweb;
extern crate gif;

fn main() {
    stdweb::initialize();

    let message = "Hello, 世界!!";
    js! {
        console.log( @{message} );
    }

    // Get pixel data from some source
    let mut pixels: Vec<u8> = vec![0; 30_000];
    // Create frame from data
    let frame = gif::Frame::from_rgb(100, 100, &mut *pixels);
    // Create encoder
    let mut image = vec![];
    {
        let mut encoder = gif::Encoder::new(&mut image, frame.width, frame.height, &[]).unwrap();
        // Write frame to file
        encoder.write_frame(&frame).unwrap();
    }

    let total = format!("总字节:{}", image.len());

    js! {
        console.log( @{total} );
    }

    stdweb::event_loop();
}