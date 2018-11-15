//index.js
//获取应用实例
const app = getApp()
const autoTip = "自动连续拍摄照片(<=3秒)";
const manualTip = "点击拍照按钮添加照片";
const txtStart = "开始";
const MOD_AUTO = "auto";
const txtCpature = "拍照";
const MOD_MANUAL = "manual";
const IMAGE_WIDTH = 200.0;
const IMAGE_HEIGHT = 200.0;

var startCounter = -1; //倒计时 -1:未开始, 0:正在拍照
var canvasContext;
var cameraContext;
var stopContinuousCapture = false;
//连续拍摄的照片路径数组
var photos = [];
var autoCaptureStartTime = 0;

Page({
  data: {
    mode: MOD_AUTO,
    tipStart: txtStart,
    tip: autoTip,
    cam_position: 'front',
    mdisable: false,
    btnDisabled: false,
    create_disable: false,
    adisable: false,
    image_count: 0,
    fps: '2帧',
    fpsArray: ['1帧/秒', '2帧/秒', '3帧/秒', '4帧/秒', '5帧/秒', '6帧/秒', '7帧/秒', '8帧/秒', '9帧/秒', '10帧/秒', '11帧/秒', '12帧/秒']
  },
  fnCount: function(){
    if (startCounter == 0){
      //开始自动拍照
      console.log("开始自动拍照...");
      this.startAutoCapture();
    }else{
      startCounter -= 1;
      setTimeout(this.fnCount, 1000);
      this.setData({tipStart: "摆好姿势!"+startCounter+"s" });
    }
  },
  createGif: function(){
    let count = app.globalData.gifHelper.count();
    //console.log("生成gif，图片数量：", count);
    if(count <= 1){
      var msg = "至少拍摄两张照片";
      if (count == 0) {
        msg = "请先拍摄照片";
      }
      wx.showToast({icon:'none', title: msg, });
    }else{
      //生成gif
      wx.showLoading({
        title: "正在生成GIF图...",
        mask: true,
      });
      let imageStr = app.globalData.gifHelper.create(IMAGE_WIDTH, IMAGE_HEIGHT, parseInt(this.data.fps.replace('帧', '')));
      const arrayBuffer = wx.base64ToArrayBuffer(imageStr);
      let fsm = wx.getFileSystemManager();
      let filePath = `${wx.env.USER_DATA_PATH}/` + 'create.gif';
      fsm.writeFile({
        filePath: filePath,
        data: arrayBuffer,
        success: function (res) {
          console.log("gif创建成功:", res);
          wx.saveImageToPhotosAlbum({
            filePath: filePath,
            success: function(res){
              wx.hideLoading();
              wx.showToast({ title: 'GIF已保存到到相册'});
              app.globalData.gifHelper.clear();
            },
            fail: function(err){
              wx.showModal({
                title: '提示',
                content: "GIF保存失败!" + JSON.stringify(err),
                showCancel: false,
              });
            }
          });
        },
        fail: function (err) {
          console.log("gif创建失败失败:", err);
        }
      });
    }
  },
  //切换前后摄像头
  changeCamera: function(){
    if (startCounter != -1) {
      // 0或者3 说明正在拍照
      return;
    }
    let curPos = this.data.cam_position;
    console.log("curPos=", curPos);
    if(curPos=='front'){
      this.setData({ cam_position: 'back'});
    }else{
      this.setData({ cam_position: 'front' });
    }
  },

  addImage:function(fileName, cb){
    var page = this;
    //添加一张照片
    wx.getImageInfo({
      src: fileName,
      success(res) {
        console.log("照片信息:", res);
        let width = IMAGE_WIDTH;
        let height = IMAGE_HEIGHT / res.width * res.height;
        console.log(res.width);
        console.log(res.height);
        console.log(width, height);
        let top = (IMAGE_WIDTH - height) / 2;
        canvasContext.drawImage(fileName, 0, top, width, height);
        canvasContext.draw(false, function(){
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
              console.log("canvas截图成功", res.tempFilePath);

              //获取base64添加到gif工厂
              let fsm = wx.getFileSystemManager();
              fsm.readFile({
                filePath: res.tempFilePath,
                encoding: "base64",
                success: function (res) {
                  console.log("base64照片读取结果:", res);
                  console.log("gifHelper.add:", app.globalData.gifHelper.add(res.data));
                  cb();
                },
                fail: function (err) {
                  console.log("base64照片读取失败:", err);
                  cb();
                }
              });
              console.log("图片总数:", app.globalData.gifHelper.count());
            },
            fail: function(err){
              console.log("canvas截图失败!");
              cb();
            }
          });
        });
      }
    });
  },
  takePhoto: function(cb){
    var page = this;
    cameraContext.takePhoto({
      quality: 'normal',
      success: (res) => {
        console.log("拍照结果:", res.tempImagePath);
        page.addImage(res.tempImagePath, function () {
          console.log("图片已添加.");
          if(cb) cb(true);
        });
      },
      fail: function (res) {
        console.log("拍照失败", res);
        if (cb) cb(false);
      }
    });
  },
  createGifFromPhotos: function(){
    //生成完毕使能生成按钮 page.setData({ create_disable: false });
    wx.showLoading({
      title: '正在生成GIF...',
      mask: true,
    });
    photos.forEach(function(){
      s
      page.addImage(res.tempImagePath, function () {
        console.log("图片已添加.");
        if (cb) cb(true);
      });
    });
  },
  //连续拍摄照片
  startAutoCapture:function(){
    var page = this;
    //检查是否超过3s
    if (autoCaptureStartTime!=0){
        let elpased = Date.now()-autoCaptureStartTime;
        if(elpased>3000){
          wx.showToast({title: '拍摄完成'});
          autoCaptureStartTime = 0;
          this.setData({ tipStart: "开始" });
          page.createGifFromPhotos();
          return;
        }
    }
    if(autoCaptureStartTime==0){
      //开始拍摄
      autoCaptureStartTime = Date.now();
      photos.length = 0;
      this.setData({ tipStart: "停止" });
      page.setData({ create_disable: true});
    }
    cameraContext.takePhoto({
      quality: 'normal',
      success: (res) => {
        //console.log("拍照结果:", res.tempImagePath);
        photos.push(res.tempImagePath);
        //继续拍摄下一张
        page.startAutoCapture();
      },
      fail: function (res) {
        autoCaptureStartTime = 0;
        this.setData({ tipStart: "开始" });
        page.setData({ create_disable: false });
        wx.showModal({
          title: '错误',
          content: '拍照失败!'+JSON.stringify(res),
        });
      }
    });
  },
  stopAutoCapture:function(){
    startCounter = -1;
    autoCaptureStartTime = 0;
    this.setData({ mdisable: false, tipStart: "开始" });
    if(photos.length==0){
      wx.showToast({
        title: '没有拍摄照片',
        icon: 'none',
      });
      this.setData({ create_disable: false });
    }else if(photos.length==1){
      wx.showToast({
        title: '至少拍摄两张照片',
        icon: 'none',
      });
      this.setData({ create_disable: false });
    }else{
      this.createGifFromPhotos();
    }
  },
  fnStart: function(){
    var page = this;
    if (this.data.mode==MOD_AUTO){
      //autoCaptureStartTime
      if (startCounter==0){
        //正在自动拍照，点击停止
        page.stopAutoCapture();
      }else if (startCounter==-1){
        startCounter = 3;
        //开始倒计时
        this.setData({ mdisable: 'true', tipStart: "摆好姿势!3s" });
        setTimeout(this.fnCount, 1000);
      }else{
        //正在倒计时不做操作
      }
    }else{
      //手动模式, 点击拍照
      //拍照时禁用按钮
      wx.showLoading({
        title: "正在拍摄照片...",
        mask: true,
      });
      page.setData({ adisable:true, btnDisabled: true});
      page.takePhoto(function(){
        page.setData({ image_count: app.globalData.gifHelper.count(), adisable:false, btnDisabled: false });
        wx.hideLoading();
      });
    }
  },
  modeChange: function(e){
    console.log("modeChange", e);
    let value = e.detail.value;
    //清空添加的图片
    app.globalData.gifHelper.clear();
    if (value =='auto'){
      this.setData({ image_count: 0, mode:MOD_AUTO, tip: autoTip, tipStart: txtStart});
    }else{
      this.setData({ image_count: 0, mode: MOD_MANUAL, tip: manualTip, tipStart: txtCpature});
    }
  },
  //事件处理函数
  bindFpsChange: function(res) {
    console.log(res);
    this.setData({fps: this.data.fpsArray[res.detail.value].replace('/秒', '')});
  },
  onLoad: function () {
    console.log("onLoad....");
    canvasContext = wx.createCanvasContext('canvas');
    cameraContext = wx.createCameraContext();
  }
})
