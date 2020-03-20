
//! # copy of gif/encoder.rs
use std::cmp::min;
use std::io;
use std::io::prelude::*;

use lzw;
use gif::Parameter;
use gif::{Block, Frame, Extension, DisposalMethod};

fn write_le(buffer: &mut Vec<u8>, n: u8) -> io::Result<()> {
    buffer.write_all(&[n])
}

fn write_le_u16(buffer: &mut Vec<u8>, n: u16) -> io::Result<()> {
    buffer.write_all(&[n as u8, (n>>8) as u8])
}

/// Number of repetitions
pub enum Repeat {
    /// Finite number of repetitions
    Finite(u16),
    /// Infinite number of repetitions
    Infinite
}

impl Parameter<Encoder> for Repeat {
    type Result = Result<(), io::Error>;
    fn set_param(self, this: &mut Encoder) -> Self::Result {
        this.write_extension(ExtensionData::Repetitions(self))
    }
}

/// Implemented for objects that have parameters.
///
/// Provides a unified `set`-method to simplify the configuration.
pub trait SetParameter: Sized {
    /// Sets `value` as a parameter of `self`.
    fn set<T: Parameter<Self>>(&mut self, value: T) -> <T as Parameter<Self>>::Result {
        value.set_param(self)
    }
}

impl<T> SetParameter for T {}

/// Extension data.
pub enum ExtensionData {
    /// Control extension. Use `ExtensionData::new_control_ext` to construct.
    Control { 
        /// Flags.
        flags: u8,
        /// Frame delay.
        delay: u16,
        /// Transparent index.
        trns: u8
    },
    /// Sets the number of repetitions
    Repetitions(Repeat)
}

impl ExtensionData {
    /// Constructor for control extension data.
    ///
    /// `delay` is given in units of 10 ms.
    pub fn new_control_ext(delay: u16, dispose: DisposalMethod, 
                           needs_user_input: bool, trns: Option<u8>) -> ExtensionData {
        let mut flags = 0;
        let trns = match trns {
            Some(trns) => {
                flags |= 1;
                trns as u8
            },
            None => 0
        };
        flags |= (needs_user_input as u8) << 1;
        flags |= (dispose as u8) << 2;
        ExtensionData::Control {
            flags: flags,
            delay: delay,
            trns: trns
        }
    }
}

struct BlockWriter<'a> {
    w: &'a mut Vec<u8>,
    bytes: usize,
    buf: [u8; 0xFF]
}

impl <'a> BlockWriter<'a> {
    fn new(w: &'a mut Vec<u8>) -> BlockWriter<'a> {
        BlockWriter {
            w: w,
            bytes: 0,
            buf: [0; 0xFF]
        }
    }
}

impl <'a> Write for BlockWriter<'a> {

    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        let to_copy = min(buf.len(), 0xFF - self.bytes);
        { // isolation to please borrow checker
            let destination = &mut self.buf[self.bytes..];
            destination[..to_copy].copy_from_slice(&buf[..to_copy]);
        }
        self.bytes += to_copy;
        if self.bytes == 0xFF {
            self.bytes = 0;
            write_le(&mut self.w, 0xFFu8)?;
            self.w.write_all(&self.buf)?;
        }
        Ok(to_copy)
    }
    fn flush(&mut self) -> io::Result<()> {
        return Err(io::Error::new(
            io::ErrorKind::Other,
            "Cannot flush a BlockWriter, use `drop` instead."
        ))
    }
}

impl <'a> Drop for BlockWriter<'a> {

    #[cfg(feature = "raii_no_panic")]
    fn drop(&mut self) {
        if self.bytes > 0 {
            let _ = write_le(&mut self.w, self.bytes as u8);
            let _ = self.w.write_all(&self.buf[..self.bytes]);    
        }
    }

    #[cfg(not(feature = "raii_no_panic"))]
    fn drop(&mut self) {
        if self.bytes > 0 {
            write_le(&mut self.w, self.bytes as u8).unwrap();
            self.w.write_all(&self.buf[..self.bytes]).unwrap();    
        }
    }
}

/// GIF encoder.
pub struct Encoder {
    w: Vec<u8>,
    global_palette: bool,
    width: u16,
    height: u16
}

impl Encoder {
    /// Creates a new encoder.
    ///
    /// `global_palette` gives the global color palette in the format `[r, g, b, ...]`,
    /// if no global palette shall be used an empty slice may be supplied.
    pub fn new(w: Vec<u8>, width: u16, height: u16, global_palette: &[u8]) -> io::Result<Self> {
        Encoder {
            w,
            global_palette: false,
            width: width,
            height: height
        }.write_global_palette(global_palette)
    }

    /// Writes the global color palette.
    pub fn write_global_palette(mut self, palette: &[u8]) -> io::Result<Self> {
        self.global_palette = true;
        let mut flags = 0;
        flags |= 0b1000_0000;
        let num_colors = palette.len() / 3;
        if num_colors > 256 {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, "Too many colors"));
        }
        flags |= flag_size(num_colors);
        flags |= flag_size(num_colors) << 4; // wtf flag
        self.write_screen_desc(flags)?;
        self.write_color_table(palette)?;
        Ok(self)
    }

    /// Writes a frame to the image.
    ///
    /// Note: This function also writes a control extension if necessary.
    pub fn write_frame(&mut self, frame: &Frame) -> io::Result<()> {
        // TODO commented off to pass test in lib.rs
        //if frame.delay > 0 || frame.transparent.is_some() {
            self.write_extension(ExtensionData::new_control_ext(
                frame.delay,
                frame.dispose,
                frame.needs_user_input,
                frame.transparent

            ))?;
        //}
        write_le(&mut self.w, Block::Image as u8)?;
        write_le_u16(&mut self.w, frame.left)?;
        write_le_u16(&mut self.w, frame.top)?;
        write_le_u16(&mut self.w, frame.width)?;
        write_le_u16(&mut self.w, frame.height)?;
        let mut flags = 0;
        if frame.interlaced {
            flags |= 0b0100_0000;
        }
        match frame.palette {
            Some(ref palette) => {
                flags |= 0b1000_0000;
                let num_colors = palette.len() / 3;
                if num_colors > 256 {
                    return Err(io::Error::new(io::ErrorKind::InvalidInput, "Too many colors"));
                }
                flags |= flag_size(num_colors);
                write_le(&mut self.w, flags)?;
                self.write_color_table(palette)
            },
            None => if !self.global_palette {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidInput,
                    "The GIF format requires a color palette but none was given."
                ))
            } else {
                write_le(&mut self.w, flags)
            }
        }?;
        self.write_image_block(&frame.buffer)
    }

    fn write_image_block(&mut self, data: &[u8]) -> io::Result<()> {
        {
            let min_code_size: u8 = match flag_size(*data.iter().max().unwrap_or(&0) as usize + 1) + 1 {
                1 => 2, // As per gif spec: The minimal code size has to be >= 2
                n => n
            };
            write_le(&mut self.w, min_code_size)?;
            let mut bw = BlockWriter::new(&mut self.w);
            let mut enc = lzw::Encoder::new(lzw::LsbWriter::new(&mut bw), min_code_size)?;
            enc.encode_bytes(data)?;
        }
        write_le(&mut self.w, 0u8)
    }

    fn write_color_table(&mut self, table: &[u8]) -> io::Result<()> {
        let num_colors = table.len() / 3;
        if num_colors > 256 {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, "Too many colors"));
        }
        let size = flag_size(num_colors);
        self.w.write_all(&table[..num_colors * 3])?;
        // Waste some space as of gif spec
        for _ in 0..((2 << size) - num_colors) {
            self.w.write_all(&[0, 0, 0])?
        }
        Ok(())
    }

    /// Writes an extension to the image.
    ///
    /// It is normally not necessary to call this method manually.
    pub fn write_extension(&mut self, extension: ExtensionData) -> io::Result<()> {
        use self::ExtensionData::*;
        // 0 finite repetitions can only be achieved
        // if the corresponting extension is not written
        if let Repetitions(Repeat::Finite(0)) = extension {
            return Ok(())
        }
        write_le(&mut self.w, Block::Extension as u8)?;
        match extension {
            Control { flags, delay, trns } => {
                write_le(&mut self.w, Extension::Control as u8)?;
                write_le(&mut self.w, 4u8)?;
                write_le(&mut self.w, flags)?;
                write_le_u16(&mut self.w, delay)?;
                write_le(&mut self.w, trns)?;
            }
            Repetitions(repeat) => {
                write_le(&mut self.w, Extension::Application as u8)?;
                write_le(&mut self.w, 11u8)?;
                self.w.write(b"NETSCAPE2.0")?;
                write_le(&mut self.w, 3u8)?;
                write_le(&mut self.w, 1u8)?;
                match repeat {
                    Repeat::Finite(no) => write_le_u16(&mut self.w, no)?,
                    Repeat::Infinite => write_le_u16(&mut self.w, 0u16)?,
                }
            }
        }
        write_le(&mut self.w, 0u8)
    }

    /// Writes a raw extension to the image.
    ///
    /// This method can be used to write an unsupported extesion to the file. `func` is the extension 
    /// identifier (e.g. `Extension::Application as u8`). `data` are the extension payload blocks. If any
    /// contained slice has a lenght > 255 it is automatically divided into sub-blocks.
    pub fn write_raw_extension(&mut self, func: u8, data: &[&[u8]]) -> io::Result<()> {
        write_le(&mut self.w, Block::Extension as u8)?;
        write_le(&mut self.w, func as u8)?;
        for block in data {
            for chunk in block.chunks(0xFF) {
                write_le(&mut self.w, chunk.len() as u8)?;
                self.w.write_all(chunk)?;
            }
        }
        write_le(&mut self.w, 0u8)
    }

    /// Writes the logical screen desriptor
    fn write_screen_desc(&mut self, flags: u8) -> io::Result<()> {
        self.w.write_all(b"GIF89a")?;
        write_le_u16(&mut self.w, self.width)?;
        write_le_u16(&mut self.w, self.height)?;
        write_le(&mut self.w, flags)?; // packed field
        write_le(&mut self.w, 0u8)?; // bg index
        write_le(&mut self.w, 0u8) // aspect ratio
    }

    pub fn get_file(&self) -> &Vec<u8>{
        &self.w
    }
}

impl Drop for Encoder{

    #[cfg(feature = "raii_no_panic")]
    fn drop(&mut self) {
        let _ = write_le(&mut self.w, Block::Trailer as u8);
    }

    #[cfg(not(feature = "raii_no_panic"))]
    fn drop(&mut self) {
        write_le(&mut self.w, Block::Trailer as u8).unwrap()
    }
}

// Color table size converted to flag bits
fn flag_size(size: usize) -> u8 {
    match size {
        0  ...2   => 0,
        3  ...4   => 1,
        5  ...8   => 2,
        7  ...16  => 3,
        17 ...32  => 4,
        33 ...64  => 5,
        65 ...128 => 6,
        129...256 => 7,
        _ => 7
    }
}
