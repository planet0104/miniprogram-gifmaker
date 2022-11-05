import { generateHeaders } from './gifmaker/gifmaker'
var imageHelper = require("./image_helper.js");

function getHeader(){
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://www.ccfish.run/gifmaker-sec-check/server_utc_now',
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
  checkImageCloudFn(filePath){
    return new Promise(async (resolve, reject) => {
      //验证图片
      imageHelper.checkImage(filePath, function(ok){
        if(ok===true){
          resolve();
        }else{
          reject();
        }
      });
    });
  },
  checkTextCloudFn(msg){
    return new Promise(async (resolve, reject) => {
      wx.cloud.callFunction({
        name: 'msgSecCheck',
        data: {
          text: msg
        },
        success(res) {
          console.log('云函数 文字审查结果', res)
          if (res.result.errCode == 0 || res.result.errCode == '0') {
            resolve();
          } else {
            reject();
          }
        }, fail(res) {
          reject();
        }
      });
    });
  },

  //文字审查
  checkText(msg){
    return new Promise(async (resolve, reject) => {
      let header = await getHeader();
      wx.request({
        url: 'https://www.ccfish.run/gifmaker-sec-check/msg_sec_check',
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
            url: 'https://www.ccfish.run/gifmaker-sec-check/img_sec_check',
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