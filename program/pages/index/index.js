//index.js
//获取应用实例
const app = getApp()
const IMAGE_WIDTH = 200.0;
const IMAGE_HEIGHT = 200.0;

var canvasContext;
var cameraContext;
var photos = [];

Page({
  data: {
    cam_position: '前置',
    btnDisabled: false,
    image_count: 0,
    fps: '3帧',
    fps_id: 2,
    fpsArray: ['1帧/秒', '2帧/秒', '3帧/秒', '4帧/秒', '5帧/秒', '6帧/秒', '7帧/秒', '8帧/秒', '9帧/秒', '10帧/秒', '11帧/秒', '12帧/秒'],
    photos: []
  },
  createGif: function(){
    var page = this;
    let count = photos.length;
    if(count <= 1){
      var msg = "至少拍摄两张照片";
      if (count == 0) {
        msg = "请先拍摄照片";
      }
      wx.showToast({icon:'none', title: msg, });
    }else{
      //生成gif
      var makeCount = -1;
      wx.showLoading({
        title: "GIF制作中...",
        mask: true,
      });
      app.globalData.gifHelper.clear();
      var cb1;
      var cb = function () {
        makeCount += 1;
        if(makeCount==count){
          //所有图片添加完成, 开始制作
          console.log(new Date(), "所有图片添加完成, 开始制作gif...");
          let imageStr = app.globalData.gifHelper.create(IMAGE_WIDTH, IMAGE_HEIGHT, parseInt(page.data.fps.replace('帧', '')));
          console.log(new Date(), "制作gif结束:", imageStr);
          //保存制作完成的gif
          const arrayBuffer = wx.base64ToArrayBuffer(imageStr);
          let fsm = wx.getFileSystemManager();
          wx.showLoading({
            title: "保存临时文件...",
            mask: true,
          });
          let filePath = `${wx.env.USER_DATA_PATH}/` + 'create'+Date.now()+'.gif';
          console.log(new Date(), "开始保存临时文件...", filePath, arrayBuffer);
          try{
            let res = fsm.writeFileSync(filePath, arrayBuffer);
            console.log(new Date(), new Date(), "gif创建结果:", res);
            wx.hideLoading();
            wx.showToast({
              title: 'GIF制作完成',
            });
            wx.navigateTo({
              url: '../preview/preview?path=' + filePath
            });
          }catch(e){
            wx.showModal({
              title: '错误',
              content: '图片读取失败!' + JSON.stringify(e),
            });
          }
          return;
        }
        wx.showLoading({
          title: "处理图片:(" + (makeCount + 1) + "/" + photos.length + ")",
          mask: true,
          });
        //循环添加每一张图片
        let fsm = wx.getFileSystemManager();
        fsm.readFile({
          filePath: photos[makeCount].path,
          encoding: "base64",
          success: function (res) {
            console.log(new Date(), "base64照片读取结果:", res);
            console.log(new Date(), "gifHelper.add:", app.globalData.gifHelper.add(res.data));
            cb1();
          },
          fail: function (err) {
            wx.hideLoading();
            wx.showModal({
              title: '错误',
              content: '图片读取失败!' + JSON.stringify(res),
            });
          }
        });
      };
      cb1 = cb;
      cb();
    }
  },
  clearImage: function(){
    photos.length = 0;
    this.setData({ photos: photos });
  },
  addPhotosToList:function(path, cb){
    var page = this;
    wx.showLoading({
      title: '正在添加图片...',
      mask: true,
    });
    //添加一张照片
    wx.getImageInfo({
      src: path,
      success(res) {
        console.log(new Date(), "addPhotosToList>照片信息:", res);
        let width = IMAGE_WIDTH;
        let height = IMAGE_HEIGHT / res.width * res.height;
        let top = (IMAGE_WIDTH - height) / 2;
        canvasContext.drawImage(path, 0, top, width, height);
        canvasContext.draw(false, function () {
          //提取图片
          wx.canvasToTempFilePath({
            x: 0,
            y: 0,
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
            destWidth: IMAGE_WIDTH,
            destHeight: IMAGE_HEIGHT,
            canvasId: 'canvas',
            success(res) {
              console.log(new Date(), "addPhotosToList>canvas截图成功", res.tempFilePath);
              photos.push({ path: res.tempFilePath });
              page.setData({ photos: photos });
              wx.hideLoading();
              cb();
            },
            fail: function (err) {
              cb();
              wx.hideLoading();
              wx.showModal({
                title: '错误',
                content: '添加失败!' + JSON.stringify(res),
              });
            }
          });
        });
      }
    });
  },
  //从相册选择照片
  chooseImage: function(){
    var page = this;
    wx.chooseImage({
      sizeType: ['original', 'compressed'],
      sourceType: ['album'],
      success: res => {
        if (res.tempFilePaths && res.tempFilePaths.length>0){
          var idx = 0;
          var cb1;
          var cb = function(){
              idx += 1;
              if (idx < res.tempFilePaths.length) {
                page.addPhotosToList(res.tempFilePaths[idx], cb1);
              } else {
                console.log(new Date(), '选择的图片:', page.data.photos);
              }
          };
          cb1 = cb;
          page.addPhotosToList(res.tempFilePaths[idx], cb1);
        }
      }
    });
  },
  //切换前后摄像头
  changeCamera: function(){
    let curPos = this.data.cam_position;
    if(curPos=='front'){
      this.setData({ cam_position: 'back'});
    }else{
      this.setData({ cam_position: 'front' });
    }
  },
  takePhoto: function(){
    var page = this;
    //禁止拍照按钮
    page.setData({ btnDisabled: true});
    cameraContext.takePhoto({
      quality: 'normal',
      success: (res) => {
        console.log(new Date(), "拍照结果:", res.tempImagePath);
        page.addPhotosToList(res.tempImagePath, function(){
          page.setData({ btnDisabled: false });
        });
      },
      fail: function (res) {
        page.setData({ btnDisabled: false });
        wx.showModal({
          title: '错误',
          content: '拍照失败!' + JSON.stringify(res),
        });
      }
    });
  },
  //事件处理函数
  bindFpsChange: function(res) {
    this.setData({ fps_id: res.detail.value });
    this.setData({fps: this.data.fpsArray[res.detail.value].replace('/秒', '')});
  },
  onLoad: function () {
    console.log(new Date(), "onLoad....");
    canvasContext = wx.createCanvasContext('canvas');
    cameraContext = wx.createCameraContext();
  }
})
