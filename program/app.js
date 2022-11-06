//app.js
App({
  onLaunch: function () {
    wx.clearStorage();
  },
  globalData: {
    userDataPath: `${wx.env.USER_DATA_PATH}/`,
  }
})

/*
版本1.0.3更新内容:
1、使用最新Rust版本、依赖库编译
2、GifMaker封装和代码分离, 减小体积
3、添加底部广告位
4、修复bug
5、调用security.imgSecCheck检查图片是否违规
版本1.0.4更新内容:
1、修复进度条
2、广告改为插屏广告
版本1.0.5内容：
修改图片校验逻辑，解决上传失败的问题。
*/
