use js_sys::Object;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    pub fn error(s: &str);
    #[wasm_bindgen(js_namespace = wx)]
    pub fn showModal(param: &Object);
    #[wasm_bindgen(js_namespace = wx)]
    pub fn getAccountInfoSync() -> Object;
}
