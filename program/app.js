//app.js
App({
  onLaunch: function () {
    wx.clearStorage();
  },
  globalData: {
    userDataPath: `${wx.env.USER_DATA_PATH}/`
  }
})