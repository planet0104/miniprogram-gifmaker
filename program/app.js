//app.js
App({
  onLaunch: function () {
    var gifHelper = require("gif_helper.js");
    var that = this;
    gifHelper.then(function (helper) {
      that.globalData.gifHelper = helper;
    });
  },
  globalData: {
    userInfo: null,
    gifHelper: null,
  }
})