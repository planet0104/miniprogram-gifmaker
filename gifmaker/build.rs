use std::{fs::File, io::Write};

fn main(){
    let mut file = File::create("gm_check_code.rs").unwrap();
    file.write_all(env!("gm_check_code").as_bytes()).unwrap();
}