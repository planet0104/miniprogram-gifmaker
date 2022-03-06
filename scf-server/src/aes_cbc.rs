use aes::cipher::{block_padding::Pkcs7, BlockDecryptMut, KeyIvInit};
use cbc::{Decryptor};
use anyhow::{ anyhow, Result};

pub fn aes128_decrypt(key:&[u8], iv:&[u8], encrypted_data:&[u8]) -> Result<Vec<u8>>{
    type Aes128CbcDec = Decryptor<aes::Aes128>;

    // encrypt/decrypt in-place
    // buffer must be big enough for padded plaintext
    let mut buf = vec![0u8; 48];

    let ct_len = encrypted_data.len();
    buf[..ct_len].copy_from_slice(&encrypted_data[..]);

    //Decrypt
    Ok(Aes128CbcDec::new(key.into(), iv.into())
        .decrypt_padded_mut::<Pkcs7>(&mut buf)
        .map_err(|err| anyhow!("{:?}", err))?
        .to_vec())
}