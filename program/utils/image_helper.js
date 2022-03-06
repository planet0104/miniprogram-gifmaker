module.exports = {
  //图片审查
  checkImage: function (path, callback) {
    console.log("checkImage", path);
    wx.showLoading({
      title: "正在验证图片",
      mask: false,
    });
    /*
    调用
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