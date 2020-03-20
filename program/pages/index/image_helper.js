module.exports = {
  //压缩图片
  checkImage: function (path, canvasContext, callback) {
    wx.showLoading({
      title: "开始验证图片",
      mask: false,
    });
    console.log("checkImage:", path, "canvasContext=", canvasContext);
    let MAX_WIDTH = 500;
    let MAX_HEIGHT = 500;
    wx.getImageInfo({
      src: path,
      success(res) {
        var width = res.width;
        var height = res.height;
        var new_width = width;
        var new_height = height;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          var new_width = width;
          var new_height = height;
          if (width > MAX_WIDTH) {
            new_width = MAX_WIDTH;
            new_height = (height / width) * MAX_WIDTH;
          }
          if (new_height > MAX_HEIGHT) {
            new_height = MAX_HEIGHT;
            new_width = (width / height) * MAX_HEIGHT;
          }
        }
        new_width = parseInt(new_width);
        new_height = parseInt(new_height);
        //console.log("绘制大小", new_width, new_height);
        //绘制
        console.log("-------------绘制压缩图片:", new_width, new_height);
        canvasContext.drawImage(path, 0, 0, new_width, new_height);
        canvasContext.draw(false, function (res) {
          console.log("draw:", res);
          //保存临时文件，使用imgSecCheck检查图片是否违规
          wx.canvasToTempFilePath({
            x: 0,
            y: 0,
            width: new_width,
            height: new_height,
            destWidth: new_width,
            destHeight: new_height,
            fileType: "jpg",
            quality: 0.6,
            canvasId: 'canvas-check',
            success(res) {
              console.log("imgSecCheck临时文件保存成功", res.tempFilePath);
              wx.showLoading({
                title: "正在验证图片",
                mask: false,
              });
              var tempFilePath = res.tempFilePath;
              wx.getFileSystemManager().readFile({
                filePath: tempFilePath,
                success: function (res) {
                  wx.showLoading({
                    title: "正在验证图片",
                    mask: false,
                  });
                  wx.cloud.callFunction({
                    name: 'imgSecCheck',
                    data: {
                      imgType: tempFilePath.split('.').pop(),
                      file: res.data
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
                },
                fail: function (res) {
                  callback(false);
                  wx.hideLoading();
                  console.log(res);
                  wx.showModal({
                    content: '图片读取失败，请重试',
                    showCancel: false,
                    confirmText: '确定'
                  });
                }
              });
            },
            fail(res) {
              callback(false);
              console.log("imgSecCheck临时文件保存失败", res)
              wx.hideLoading();
              console.log(res);
              wx.showModal({
                content: '临时文件保存失败，请重试',
                showCancel: false,
                confirmText: '确定'
              });
            }
          });
        });
      },
      fail(res) {
        callback(false);
        console.log("getImageInfo", res);
        wx.hideLoading();
        console.log(res);
        wx.showModal({
          content: '图片读取失败，请重试',
          showCancel: false,
          confirmText: '确定'
        });
      }
    });
  }
};