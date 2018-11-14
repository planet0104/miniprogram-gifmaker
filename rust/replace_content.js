//微信小程序不支持fetch，这里改造以下
var loadFile = new Promise(function (resolve, reject) {
    let fsm = wx.getFileSystemManager();
    fsm.readFile({
      filePath: "gif_helper.wasm",
      success: function (res) {
        resolve(res.data);
      },
      fail: function (err) {
        reject(err);
      }
    });
  });

  //wasm文件在真机上传时会丢掉
  //用wx.request请求demo.wasm时，在本地正常，真机调试wasm解析会报错，
  //所以这里改成请求base64内容，然后转换成arrayBuffer
  // var loadFile = new Promise(function (resolve, reject) {
  //   wx.request({
  //     url: 'https://planet0104.github.io/demo.wasm.txt',
  //     responseType: "text",
  //     success: function (res) {
  //       const arrayBuffer = wx.base64ToArrayBuffer(res.data);
  //       resolve(arrayBuffer);
  //     },
  //     fail: (res) => {
  //       reject(res);
  //     }
  // })});

  var wasm_instance = loadFile
            .then( function( bytes ) { return WebAssembly.compile( bytes ); } )
            .then( function( mod ) { return WebAssembly.instantiate( mod, instance.imports ) });