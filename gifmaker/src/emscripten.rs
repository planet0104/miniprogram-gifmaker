use std::ffi::CString;
use std::os::raw::c_char;

extern "C" {
    fn js_init();
    fn js_console_log(msg: *const c_char);
    fn js_console_error(msg: *const c_char);
    fn js_set_module_field(key: *const c_char, value: *const c_char);
    fn js_set_module_field_json(key: *const c_char, value: *const c_char);
    fn js_delete_module_field(key: *const c_char);
}

pub fn init() {
    unsafe { js_init() };
}

pub fn console_log(msg: &str) {
    let url = CString::new(msg).unwrap();
    let ptr = url.as_ptr();
    unsafe { js_console_log(ptr) };
}

pub fn console_error(msg: &str) {
    let url = CString::new(msg).unwrap();
    let ptr = url.as_ptr();
    unsafe { js_console_error(ptr) };
}

pub fn delete_module_field(key: &str) {
    let url = CString::new(key).unwrap();
    let ptr = url.as_ptr();
    unsafe { js_delete_module_field(ptr) };
}

pub fn set_module_field(key: &str, value: &str) {
    let url = CString::new(key).unwrap();
    let key_ptr = url.as_ptr();
    let url = CString::new(value).unwrap();
    let value_ptr = url.as_ptr();
    unsafe { js_set_module_field(key_ptr, value_ptr) };
}

pub fn set_module_field_json(key: &str, value: &str) {
    let url = CString::new(key).unwrap();
    let key_ptr = url.as_ptr();
    let url = CString::new(value).unwrap();
    let value_ptr = url.as_ptr();
    unsafe { js_set_module_field_json(key_ptr, value_ptr) };
}