module.exports = {

  //文字审查
  checkText(msg, header){
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://127.0.0.1:9990/msg_sec_check',
        method: 'POST',
        data: msg,
        header,
        fail(res){
          console.error('文字审核失败:', res);
          reject();
        },
        success (res) {
          console.log('文字审核结果',res.data);
          if(res.data.errcode == 0){
            resolve();
          }else{
            reject();
          }
        }
      });
    });
  },

  //图片审查
  checkImage(filePath, header) {
    console.log("checkImage", filePath);
    return new Promise((resolve, reject) => {
      //文件转base64
      var fs = wx.getFileSystemManager();
      fs.readFile({
        filePath,
        // encoding: 'base64',
        success(res) {
          console.log('审查图片大小:'+res.data.byteLength);
          wx.request({
            url: 'http://127.0.0.1:9990/img_sec_check',
            method: 'POST',
            data: res.data,
            header,
            fail(res){
              console.error('图片审核失败:', res);
              reject();
            },
            success (checkRes) {
              console.log('图片审核结果',checkRes.data);
              if(checkRes.data.errcode == 0){
                resolve();
              }else{
                reject();
              }
            }
          });
        },
        fail(res) {
          console.error('文件读取失败', res);
          reject();
        }
      })
    });
  }
};