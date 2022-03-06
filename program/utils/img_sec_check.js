module.exports = {

  //文字审查
  checkText(msg, header, callback){
    wx.request({
      url: 'https://service-n6jh85tz-1256376761.sh.apigw.tencentcs.com/release/gifmaker',
      method: 'POST',
      data: {
        msg,
      },
      header,
      fail(res){
        console.error('文字审核失败:', res);
        callback(false);
      },
      success (res) {
        console.log('文字审核结果',res.data);
        callback(res.data.pass);
      }
    });
  },

  //图片审查
  checkImage(filePath, header, callback) {
    console.log("checkImage", filePath);
    //文件转base64
    var fs = wx.getFileSystemManager();
    fs.readFile({
      filePath,
      encoding: 'base64',
      success(res) {
        console.log('审查图片大小:'+res.data.length);
        wx.request({
          url: 'https://service-n6jh85tz-1256376761.sh.apigw.tencentcs.com/release/gifmaker',
          method: 'POST',
          data: {
            img:res.data,
          },
          header,
          fail(res){
            console.error('图片审核失败:', res);
            callback(false);
          },
          success (res) {
            console.log('图片审核结果',res.data);
            callback(res.data.pass);
          }
        });
      },
      fail(res) {
        console.error('文件读取失败', res);
        callback(false);
      }
    })
  }
};