//编译之前确认emscripten.c中的头文件路径正确
//如果编译不过，将emcc目录下的libc.a放到.emscripten_cache中
fn main() {
    cc::Build::new()
        .file("src\\emscripten.c")
        .compile("emscripten");
}