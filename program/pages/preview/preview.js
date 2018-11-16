//preview.js
//获取应用实例
const app = getApp();

Page({
  data: {
  },
  save: function(){
    wx.saveImageToPhotosAlbum({
      filePath: this.data.path,
      success: function (res) {
        wx.hideLoading();
        wx.showToast({ title: '已保存' });
        //返回上一页
        wx.navigateBack();
      },
      fail: function (err) {
        wx.showModal({
          title: '提示',
          content: "GIF保存失败!" + JSON.stringify(err),
          showCancel: false,
        });
      }
    });
  },
  cancel: function(){
    //返回上一页
    wx.navigateBack();
  },
  onLoad: function (res) {
    this.setData({ path: res.path});
  }
})
