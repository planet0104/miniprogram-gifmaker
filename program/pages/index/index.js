//index.js
//获取应用实例
const app = getApp();

const worker = wx.createWorker('workers/ministdweb.js');

var tipId = 0;
//imgSizeId对应最多图片限制
var imgSizeMax = [100/*50px*/,64/*80px*/,36/*100px*/,20/*150px*/,12/*200px*/,8/*250px*/,6/*300px*/,4/*350px*/];

var prompt;
var textColor = 'white';

var textColors = ['white', 'black', 'red', 'yellow', 'green', 'blue'];

worker.onMessage(function (msg) {
  console.log("主线程收到消息:", msg);
});

var do_preview = false;
var text = "";
var bindText = "";

var canvasContext;
var cameraContext;
var photos = [];
var tmpPhotos = [];

Page({
  onLoad: function () {
    var page = this;
    canvasContext = wx.createCanvasContext('canvas');
    cameraContext = wx.createCameraContext();
    let fsm = wx.getFileSystemManager();
    let filePath = `${wx.env.USER_DATA_PATH}/` + 'app.data';
    try {
      let res = fsm.readFile({
        filePath: filePath,
        encoding: "utf8",
        success: function (res) {
          //console.log("临时文件读取成功", res);
          page.setData(JSON.parse(res.data));
          photos = page.data.photos;
        },
        fail: function (res) {
          //console.log('临时文件读取失败!', res);
        }
      });
    } catch (e) { }
  },
  onHide: function(){
    let fsm = wx.getFileSystemManager();
    let filePath = `${wx.env.USER_DATA_PATH}/` + 'app.data';
    try {
      let res = fsm.writeFile({
        filePath: filePath, data: JSON.stringify(this.data),
        success: function (res) {
          //console.log("临时文件保存成功", res);
        },
        fail: function (res) {
          //console.log('临时文件保存失败!', res);
        }
      });
    } catch (e) {}
  },
  showInputText: function(){
    this.setData({ isInputTextHidden: false });
  },
  bindText: function(e){
    bindText = e.detail.value;
  },
  setText: function(){
    text = bindText;
    //console.log("文本:", text);
    this.setData({ isInputTextHidden: true});
  },
  onShareAppMessage: function (res) {
    return {
      title: '大头贴动画制作',
      path: '/page/index',
      imageUrl: "/static/basicprofile.png"
    }
  },
  showLoading: function(title){
    wx.showLoading({
      title: title,
      mask: false,
    });
  },
  showError: function(msg){
    wx.showModal({
      title: '错误',
      content: msg,
    });
  },
  data: {
    finishGifPath: null,
    imageSize: 150,
    isInputTextHidden: true,
    cam_position: '前置',
    btnDisabled: false,
    image_count: 0,
    fps: '3帧',
    fps_id: 2,
    fpsArray: ['1帧/秒', '2帧/秒', '3帧/秒', '4帧/秒', '5帧/秒', '6帧/秒', '7帧/秒', '8帧/秒', '9帧/秒', '10帧/秒', '11帧/秒', '12帧/秒'],
    imgSize: '150px',
    imgSizeId: 3,
    imgSizeArray: ["图宽50px", "图宽80px", "图宽100px", "图宽150px", "图宽200px", "图宽250px", "图宽300px", "图宽350px"],
    textColorId: 0,
    textColor: '白色',
    textColorArray: ['白色', '黑色', '红色', '黄色', '绿色', '蓝色'],
    photos: [],
    tool_tip: '点击拍照按钮添加照片'
  },
  createGif1: function(){
    //如果已经生成过gif，直接预览
    if(this.data.finishGifPath){
        wx.previewImage({
          urls: [this.data.finishGifPath]
        });
      return;
    }
    do_preview = true;
    this.createGif();
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
      if (tmpPhotos.length == 0) {
        //图片大小
        var maxCount = imgSizeMax[page.data.imgSizeId];
        if(photos.length>maxCount){
          wx.showModal({
            title: '是否继续',
            content: page.data.imgSize + '图片最多支持' + maxCount + '张，是否删除多余的照片并继续？',
            showCancel: true,
            cancelText: '返回修改',
            confirmText: '删除',
            success: function(res) {
              if (res.confirm) {
                photos.length = maxCount;
                page.setData({ photos: photos });
                page.addImage();
              }
            }
          })
        }else{
          this.addImage();
        }
        return;
      }

      page.showLoading("初始化GIF...");
      worker.onMessage(function (msg) {
        if(msg.what == "progress"){
          page.showLoading("GIF制作中(" + msg.arg0 + "/" + msg.arg1 + ")");
          return;
        }
        
        //清空数据
        worker.onMessage(function(msg){});
        worker.postMessage({
          what: "clear",
          data: new ArrayBuffer(0),
          width: 0,
          height: 0,
          fps: 0
        });
        tmpPhotos.length = 0;

        //console.log("GIF制作完成:", msg);
        const fileData = new Uint8Array(msg.obj);
        //保存制作完成的gif
        let fsm = wx.getFileSystemManager();
        page.showLoading("保存临时文件...");
        let filePath = `${wx.env.USER_DATA_PATH}/` + 'create.gif';
        try {
          let res = fsm.writeFile({
            filePath: filePath, data: fileData.buffer,
            success: function (res) {
              page.data.finishGifPath = filePath;
              if (do_preview) {
                wx.previewImage({
                  urls: [filePath]
                });
                do_preview = false;
              } else {
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
            },
            fail: function (res) {
              page.showError('临时文件保存失败!' + JSON.stringify(res));
            },
            complete: function (res) {
              wx.hideLoading();
            }
          });
        } catch (e) {
          wx.hideLoading();
          page.showError('图片读取失败!' + JSON.stringify(e));
        }
      });
      worker.postMessage({
        what: "create",
        data: new ArrayBuffer(0),
        width: page.data.imageSize,
        height: page.data.imageSize,
        fps: parseInt(page.data.fps.replace('帧', ''))
      });
    }
  },
  clearImage: function(){
    var page = this;
    page.showLoading("清除图片");
    worker.onMessage(function (msg) {
      //console.log("图片已清除:", msg);
      photos.length = 0;
      page.setData({ photos: photos });
      wx.hideLoading();
    });
    worker.postMessage({
      what: "clear",
      data: new ArrayBuffer(0),
      width: 0,
      height: 0,
      fps: 0
    });
  },
  //一次性给GIF制作器添加所有图片
  addImage: function(){
    //添加一张照片
    if(tmpPhotos.length == photos.length){
      this.createGif();
      return;
    }
    //console.log("addImgae>>>>>>>>>>>>tmpPhotos.len=", tmpPhotos.length, "photos.len=", photos.length);
    //选出当前要添加的图片
    var nextId = tmpPhotos.length;
    var photo = photos[nextId];
    tmpPhotos.push(photo.path);
    this.showLoading("添加图片" + tmpPhotos.length + "/" + photos.length);
    var page = this;
    wx.getImageInfo({
      src: photo.path,
      success(res) {
        let width = page.data.imageSize;
        let height = page.data.imageSize / res.width * res.height;
        let top = (page.data.imageSize - height) / 2;
        canvasContext.drawImage(photo.path, 0, top, width, height);
        canvasContext.setFillStyle(textColor);
        canvasContext.setFontSize(page.data.imageSize / 8);
        canvasContext.fillText(text, 10, page.data.imageSize - (page.data.imageSize / 7), page.data.imageSize);
        canvasContext.draw(false, function () {
          //提取图片
          wx.canvasGetImageData({
            canvasId: 'canvas',
            x: 0,
            y: 0,
            width: page.data.imageSize,
            height: page.data.imageSize,
            success(res) {
              worker.onMessage(function (msg) {
                //console.log("图片添加成功:", msg);
                page.addImage();
              });
              worker.postMessage({
                what: "add",
                data: res.data.buffer,
                width: 0,
                height: 0,
                fps: 0
              });
            },
            fail: function (err) {
              wx.hideLoading();
              tmpPhotos.length = 0;
              page.showError('图片添加失败!' + JSON.stringify(res));
            }
          });
        });
      },
      fail: function(res){
        wx.hideLoading();
        tmpPhotos.length = 0;
        page.showError('图片添加失败!' + JSON.stringify(res));
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
          for(var i =0; i<res.tempFilePaths.length; i++){
            photos.push({ path: res.tempFilePaths[i] });
          }
          this.setData({ photos: photos });
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
        photos.push({ path: res.tempImagePath });
        this.setData({ photos: photos });
        page.setData({ btnDisabled: false });
        var strs = [
          '微微移动相机、加快连拍速度、调高帧率，使动画更流畅',
          '调低图片像素(例如50px)，加快制作速度',
          '如果无法拍照，请退出小程序并重新进入'];
        var change = Math.random()<0.3;
        if (change){
          let rand = Math.random();
          if (rand < 0.4) {
            tipId = 0;
          } else if (rand > 0.4 && rand < 0.8) {
            tipId = 1;
          } else {
            tipId = 2;
          }
        }
        page.setData({ tool_tip: strs[tipId]});
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
  bindImgSizeChange: function(res){
  this.data.imageSize = parseInt(this.data.imgSizeArray[res.detail.value].replace('图宽', '').replace('px', ''));
    this.setData({ imgSizeId: res.detail.value });
    this.setData({ imgSize: this.data.imageSize+'px' });
  },
  bindTextColorChange: function(res){
    textColor = textColors[res.detail.value];
    console.log("textColor=", textColor);
    this.setData({ textColor: this.data.textColorArray[res.detail.value], textColorId: res.detail.value });
  },
  onShow: function(){
    this.setData({ btnDisabled: false });
  },
})
