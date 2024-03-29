import { generateHeaders } from './gifmaker/gifmaker'

function getHeader(){
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://www.ccfish.run/serverless/server-utc-now',
      fail(res){
        reject();
      },
      success (res) {
        var time = res.data;
        let headers = generateHeaders(time);
        resolve(headers);
      }
    });
  });
}

module.exports = {
  //文字审查
  checkText(msg){
    return new Promise(async (resolve, reject) => {
      let header = await getHeader();
      wx.request({
        url: 'https://www.ccfish.run/serverless/wx-sec-check?type=msg',
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
  checkImage(filePath) {
    console.log("checkImage", filePath);
    return new Promise(async (resolve, reject) => {
      let header = await getHeader();
      //文件转base64
      var fs = wx.getFileSystemManager();
      fs.readFile({
        filePath,
        // encoding: 'base64',
        success(res) {
          console.log('审查图片大小:'+res.data.byteLength);
          wx.request({
            url: 'https://www.ccfish.run/serverless/wx-sec-check?type=img',
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