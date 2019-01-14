var fs = require("fs");  
var asmjs = fs.readFileSync("./target/asmjs-unknown-emscripten/release/ministdweb.js", "utf-8");
//处理 注释掉 Module["arguments"]=arguments
var new_content = asmjs.replace('Module["arguments"]=arguments', '');
new_content = new_content.replace('ENVIRONMENT_IS_WORKER=typeof importScripts==="function";', '');
new_content = new_content.replace('Module["arguments"]=arguments', '');
fs.writeFileSync("./html/ministdweb.js", new_content);
fs.writeFileSync("../program/workers/ministdweb.js", new_content);