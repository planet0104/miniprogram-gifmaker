var fs = require("fs");  

var code = fs.readFileSync("./target/asmjs-unknown-emscripten/release/gifmaker.js", "utf-8");

//注释掉两个 Module["arguments"]=arguments
var code = code.replace('Module["arguments"]=arguments', '');

// code = code.replace('ENVIRONMENT_IS_WORKER=typeof importScripts==="function";', '');
// code = code.replace('Module["arguments"]=arguments', '');

//解决：str.charCodeAt is not a function
code = code.replace('ENVIRONMENT_IS_WEB=typeof window==="object";', 'ENVIRONMENT_IS_WEB=true;var document={};');

// code = code.replace('FS.staticInit();__ATINIT__.unshift((function(){if(!Module["noFSInit"]&&!FS.init.initialized)FS.init()}));__ATMAIN__.push((function(){FS.ignorePermissions=false}));__ATEXIT__.push((function(){FS.quit()}));__ATINIT__.unshift((function(){TTY.init()}));__ATEXIT__.push((function(){TTY.shutdown()}));', '');

//加大内存(2的整数倍)
// code = code.replace('Module["TOTAL_STACK"]||5242880', 'Module["TOTAL_STACK"]||parseInt(5242880*6)');//栈内存总共30M
// code = code.replace('Module["TOTAL_MEMORY"]||16777216', 'Module["TOTAL_MEMORY"]||parseInt(16777216*6)');//总共96M

// code = code.replace('Runtime.dynCall', 'dynCall');

code += 'var GifMaker = {' +
  'get_file: function(){ return Module["GifMaker"].get_file(); },' +
  'create: function(width, height, fps){ return Module["GifMaker"].create(width, height, fps); },' +
  'add_png: function(array){ return Module["GifMaker"].add_png(array); }' +
'};' +
'if(window){ window.GifMaker=GifMaker;  }' +
'module.exports = GifMaker;';

fs.writeFileSync("../program/pages/index/gifmaker.js", code);