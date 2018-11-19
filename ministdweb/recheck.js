var fs = require("fs");  
var asmjs = fs.readFileSync("./target/asmjs-unknown-emscripten/release/ministdweb.js", "utf-8");
//处理 注释掉 Module["arguments"] = arguments
asmjs = asmjs.replace('Module["arguments"]=arguments', '');

fs.writeFileSync("./html/ministdweb.js", asmjs);