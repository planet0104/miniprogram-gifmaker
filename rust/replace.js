var fs = require("fs");
var nodeCmd = require('node-cmd');
var gif_helper_js = fs.readFileSync("./target/wasm32-unknown-unknown/release/gif_helper.js","utf-8");
var replace_content = fs.readFileSync("./replace_content.js","utf-8");

gif_helper_js = gif_helper_js.replace('var wasm_instance = ( typeof WebAssembly.instantiateStreaming === "function"', "");
gif_helper_js = gif_helper_js.replace('? WebAssembly.instantiateStreaming( file, instance.imports )', '');
gif_helper_js = gif_helper_js.replace('.then( function( result ) { return result.instance; } )', '');
gif_helper_js = gif_helper_js.replace(': file', '');
gif_helper_js = gif_helper_js.replace('.then( function( response ) { return response.arrayBuffer(); } )', '');
gif_helper_js = gif_helper_js.replace('.then( function( bytes ) { return WebAssembly.compile( bytes ); } )', '');
gif_helper_js = gif_helper_js.replace('.then( function( mod ) { return WebAssembly.instantiate( mod, instance.imports ) } ) );', '');

fs.writeFileSync("../program/gif_helper.js", gif_helper_js.replace('var file = fetch( "gif_helper.wasm", {credentials: "same-origin"} );', replace_content));
fs.writeFileSync("../program/gif_helper.wasm", fs.readFileSync("./target/wasm32-unknown-unknown/release/gif_helper.wasm"));
console.log("文件已写入");