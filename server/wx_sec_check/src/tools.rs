use std::io::Read;

use anyhow::{anyhow, Result};
use bytes::Bytes;

pub fn bytes_to_string(bytes: &Option<Bytes>) -> Result<String>{
    if bytes.is_none(){
        return Err(anyhow!("bytes is null"));
    }
    
    let mut json = String::new();
    let bytes = bytes.as_ref().unwrap();
    bytes.as_ref().read_to_string(&mut json)?;
    Ok(json)
}

pub fn bytes_to_vec(bytes: &Option<Bytes>) -> Result<Vec<u8>>{
    if bytes.is_none(){
        return Err(anyhow!("bytes is null"));
    }
    
    let mut data = Vec::new();
    let bytes = bytes.as_ref().unwrap();
    bytes.as_ref().read_to_end(&mut data)?;
    Ok(data)
}