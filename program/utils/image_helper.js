const uuid = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
  
    var uuid = s.join("");
    return uuid
  
  }
  
  module.exports = {
    //压缩图片
    checkImage: function (path, callback) {
      console.log("checkImage", path);
      //测试图片大小
      const fs = wx.getFileSystemManager()
      fs.readFile({
        filePath: path,
        encoding: 'binary',
        position: 0,
        success(res) {
          console.log('image_helper.checkImage 文件读取成功: ',res.data.length)
        },
        fail(res) {
          console.error('image_helper.checkImage 文件读取失败: ', res)
        }
      });

      wx.showLoading({
        title: "正在验证图片",
        mask: false,
      });
      /*
      注意：callFunction的data最大不能超过40K，不再用这种方式上传文件。
      1、将压缩后的图片上传到云存储空间，并将fileID传递给云函数。(uploadFile、callFunction)
      2、在云函数中根据fileID下载图片，然后进行验证。(downloadFile、imgSecCheck)
      3、在云函数中删除fileID对应的文件，并返回验证结果。(deleteFile)
      */
      var cloudPath = uuid() + ".gif";
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: path,
        success: res => {
          console.log("图片上传成功:", res.fileID)
          try{
            wx.cloud.callFunction({
              name: 'imgSecCheckV2',
              data: {
                imgType: "gif",
                fileID: res.fileID
              },
              success(res) {
                wx.hideLoading();
                console.log('图片审查结果', res)
                if (res.result.errCode == 0 || res.result.errCode == '0') {
                  console.log('图片经过校验,没有违法违规');
                  //绘制成功，获取图片数据
                  callback(true);
                } else {
                  callback(false);
                  console.log('图片不合规, 提示用户');
                  if (res.result.errCode == '87014') {
                    wx.showModal({
                      content: '存在敏感内容，请更换图片',
                      showCancel: false,
                      confirmText: '我知道了'
                    });
                  } else {
                    wx.showModal({
                      content: '图片不合规，请更换图片',
                      showCancel: false,
                      confirmText: '我知道了'
                    })
                  }
                }
              }, fail(res) {
                callback(false);
                console.log("图片验证失败", res);
                wx.hideLoading();
                wx.showModal({
                  content: '图片不合规，请更换图片',
                  showCancel: false,
                  confirmText: '我知道了'
                });
              }
            });
            console.log("callFunction完成:");
          }catch(e){
            console.log("callFunction出错:",e);
          }
        },
        fail: err => {
          wx.showModal({
            content: '图片验证失败，请重试',
            showCancel: false,
            confirmText: '确定'
          });
        }
      });
    }
  };