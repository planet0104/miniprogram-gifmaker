//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数
  bindViewTap: function(a) {
    console.log("开始拍照");
    const canvasContext = wx.createCanvasContext('canvas');
    canvasContext.setFillStyle('red');
    canvasContext.fillRect(0, 0, 200, 200);
    canvasContext.draw();
    wx.getImageInfo({
      src: "/screen.png",
      success(res) {
        let width = 200;
        let height = 200.0/res.width*res.height;
        console.log(res.width);
        console.log(res.height);
        console.log(width, height);
        let top = (200-height)/2;
        canvasContext.drawImage("/screen.png",0, top, width, height);
        canvasContext.draw();
      }
    });

    // ctx.drawImage("/rust.jpg");
    // ctx.draw();
    // let fsm = wx.getFileSystemManager();
    // fsm.readFile({
    //   filePath: "rust.jpg",
    //   encoding: "base64",
    //   success: function (res) {
    //     console.log("照片读取结果:", res);
    //     console.log("gifHelper.add:", app.globalData.gifHelper.add(res.data));
    //   },
    //   fail: function (err) {
    //     console.log("照片读取失败:", err);
    //   }
    // });
    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'low',
      success: (res) => {
        console.log("拍照结果:", res.tempImagePath);
        wx.getImageInfo({
          src: res.tempImagePath,
          success(res) {
            console.log(res.width)
            console.log(res.height)
          }
        });
        //canvasContext.drawImage(res.tempImagePath);
        //canvasContext.draw();
      }
    });
  },
  onLoad: function () {

    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    // console.log(e)
    // app.globalData.userInfo = e.detail.userInfo
    // this.setData({
    //   userInfo: e.detail.userInfo,
    //   hasUserInfo: true
    // })
  }
})
