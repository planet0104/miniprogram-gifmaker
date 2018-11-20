//index.js
//获取应用实例
const app = getApp()
const IMAGE_WIDTH = 200.0;
const IMAGE_HEIGHT = 200.0;

require("../../ministdweb.js");

var giflib = require("../../gif.js");

var gif;
var do_preview = false;

var canvasContext;
var cameraContext;
var photos = [];
var dataMap = new Map();

Page({
  onShareAppMessage: function (res) {
    return {
      title: '大头贴动画制作',
      path: '/page/index',
      imageUrl: "/static/basicprofile.png"
    }
  },
  showLoading: function(title){
    //console.log("showLoading title=", title);
    wx.showLoading({
      title: title,
      mask: true,
    });
  },
  showError: function(msg){
    wx.showModal({
      title: '错误',
      content: msg,
    });
  },
  data: {
    cam_position: '前置',
    btnDisabled: false,
    image_count: 0,
    fps: '3帧',
    fps_id: 2,
    fpsArray: ['1帧/秒', '2帧/秒', '3帧/秒', '4帧/秒', '5帧/秒', '6帧/秒', '7帧/秒', '8帧/秒', '9帧/秒', '10帧/秒', '11帧/秒', '12帧/秒'],
    photos: [],
    tool_tip: '点击拍照按钮添加照片'
  },
  createGif1: function(){
    do_preview = true;
    this.createGif();
  },
  createGif: function(){
    if(gif){
      gif.destory();
    }
    gif = new giflib.GIF({
      quality: 1
    });
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
      page.showLoading("GIF制作中...");

      gif.on('finished', function (array) {
        //保存制作完成的gif
        let fsm = wx.getFileSystemManager();
        page.showLoading("保存临时文件...");
        let filePath = `${wx.env.USER_DATA_PATH}/` + 'create' + Date.now() + '.gif';
        try {
          let res = fsm.writeFile({
            filePath: filePath, data: array.buffer,
            success: function (res) {
              wx.hideLoading();
              // wx.showToast({
              //   title: 'GIF制作完成',
              // });
              if (do_preview){
                wx.previewImage({
                  urls: [filePath]
                });
                do_preview = false;
              }else{
                wx.showModal({
                  title: 'GIF动画制作完成',
                  content: "点击“预览”查看动图\r\n预览页面长按可保存或分享图片",
                  confirmText: "预览",
                  cancelText: "返回",
                  success: function (res) {
                    if (res.confirm) {
                      wx.previewImage({
                        urls: [filePath]
                      });
                    }
                  }
                });
              }
              // wx.navigateTo({
              //   url: '../preview/preview?path=' + filePath
              // });
            },
            fail: function (res) {
              page.showError('临时文件保存失败!' + JSON.stringify(res));
            },
            complete: function (res) {
              //console.log("临时文件保存complete.", res);
            }
          });
        } catch (e) {
          page.showError('图片读取失败!' + JSON.stringify(e));
        }
      });
      gif.on("progress", function(progress){
        page.showLoading("生成GIF" + Math.round(progress*100)+"%");
      });
      //添加所有图片数据
      var total = photos.length;
      photos.forEach(function(item, index){
        page.showLoading("添加图片"+(index+1)+"/"+total);
        gif.addFrame(dataMap.get(item.path), { delay: 1000/parseInt(page.data.fps.replace('帧', '')) });
      });
      gif.render();
    }
  },
  clearImage: function(){
    photos.length = 0;
    dataMap.clear();
    this.setData({ photos: photos });
  },
  addPhotosToList:function(path, cb){
    var page = this;
    page.showLoading('添加图片...');
    //添加一张照片
    wx.getImageInfo({
      src: path,
      success(res) {
        let width = IMAGE_WIDTH;
        let height = IMAGE_HEIGHT / res.width * res.height;
        let top = (IMAGE_WIDTH - height) / 2;
        canvasContext.drawImage(path, 0, top, width, height);
        canvasContext.draw(false, function () {
          //提取图片
          wx.canvasGetImageData({
            canvasId: 'canvas',
            x: 0,
            y: 0,
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
            success(res) {
              var imgData = new giflib.ImageData();
              imgData.width = res.width;
              imgData.height = res.height;
              imgData.data = res.data;
              // console.log(res.width) // 100
              // console.log(res.height) // 100
              // console.log(res.data instanceof Uint8ClampedArray) // true
              // console.log(res.data.length) // 100 * 100 * 4
              photos.push({ path: path});
              dataMap.set(path, imgData);
              page.setData({ photos: photos });
              wx.hideLoading();
              cb();
            },
            fail: function (err) {
              cb();
              wx.hideLoading();
              page.showError('添加失败!' + JSON.stringify(res));
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
                //console.log(new Date(), '选择的图片:', page.data.photos);
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
        //console.log(new Date(), "拍照结果:", res.tempImagePath);
        page.addPhotosToList(res.tempImagePath, function(){
          page.setData({ btnDisabled: false });
        });
        page.setData({ tool_tip: '细微移动相机、加快连拍速度、调高帧率，可得到更流畅的动画'});
      },
      fail: function (res) {
        page.setData({ btnDisabled: false });
        page.showError('拍照失败!' + JSON.stringify(res));
      }
    });
  },
  //事件处理函数
  bindFpsChange: function(res) {
    this.setData({ fps_id: res.detail.value });
    this.setData({fps: this.data.fpsArray[res.detail.value].replace('/秒', '')});
  },
  onShow: function(){
    this.setData({ btnDisabled: false });
  },
  onLoad: function () {
    canvasContext = wx.createCanvasContext('canvas');
    cameraContext = wx.createCameraContext();
  }
})
