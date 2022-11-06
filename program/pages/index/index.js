//index.js
//获取应用实例
const app = getApp();
import init, { create, addPng, getFile } from '../../utils/gifmaker/gifmaker'
var imgSecCheck = require("../../utils/img_sec_check.js");

var tipId = 0;

var prompt;
var textColor = 'white';

var textColors = ['white', 'black', 'red', 'yellow', 'green', 'blue'];

var text = "";
var bindText = "";

var canvasContext;
var cameraContext;
var photos = [];
var tmpPhotos = [];

// 在页面中定义插屏广告
let interstitialAd = null
let nextShowTime = 0;

Page({
  async onLoad() {
    this.showLoading("加载中");
    console.log('gifmaker init...');
    await init("/utils/gifmaker/gifmaker_bg.wasm");
    console.log('gifmaker init ok.');
    wx.hideLoading();

    // 在页面onLoad回调事件中创建插屏广告实例
    if (wx.createInterstitialAd) {
      interstitialAd = wx.createInterstitialAd({
        adUnitId: 'adunit-7153322d8e28fc6c'
      })
      interstitialAd.onLoad(() => { })
      interstitialAd.onError((err) => { })
      interstitialAd.onClose(() => { })
    } else {
      console.log("wx.createInterstitialAd不存在");
    }
    canvasContext = wx.createCanvasContext('canvas');
    cameraContext = wx.createCameraContext();
    let fsm = wx.getFileSystemManager();
    let filePath = `${wx.env.USER_DATA_PATH}/` + 'app.data';
    try {
      let res = fsm.readFile({
        filePath: filePath,
        encoding: "utf8",
        success: (res) => {
          console.log("临时文件读取成功", res);
          var data = JSON.parse(res.data);
          data.photos = [];
          data.showPreview = "false";
          this.setData(data);
        },
        fail: (res)=> {
          //console.log('临时文件读取失败!', res);
        }
      });
    } catch (e) { }
  },
  onHide: function(){
  },

  onCameraError(err){
    this.setData({
      cameraError: true
    });
    wx.showToast({
      icon: 'none',
      title: '相机开启失败',
    });
    console.log('onCameraError>>', err);
  },

  jumpToFaceOff: function(){
    wx.navigateToMiniProgram({
      appId: 'wx69d023c4e39979c1',
      path: 'page/index/index',
      // extraData: {
      //   foo: 'bar'
      // },
      // envVersion: 'develop',
      success:(res)=> {
        // 打开成功
      }
    })
  },

  saveData: function(){
    let fsm = wx.getFileSystemManager();
    let filePath = `${wx.env.USER_DATA_PATH}/` + 'app.data';
    try {
      let res = fsm.writeFile({
        filePath: filePath, data: JSON.stringify(this.data),
        success: (res)=> {
          //console.log("临时文件保存成功", res);
        },
        fail: (res)=> {
          //console.log('临时文件保存失败!', res);
        }
      });
    } catch (e) { }
  },
  showInputText: function(){
    this.setData({ isInputTextHidden: false });
  },
  bindText: function(e){
    bindText = e.detail.value;
  },
  setText: function(){
    if(!bindText || bindText.length<=0){
      this.setData({ isInputTextHidden: true});
      return;
    }
    this.showLoading("正在验证文本");
    imgSecCheck.checkText(bindText).then(()=>{
      wx.hideLoading();
      text = bindText;
      console.log("文本:", text);
      this.setData({ isInputTextHidden: true});
    }).catch(()=>{
      wx.hideLoading();
      wx.showModal({
        content: '文字存在敏感内容，请重新填写',
        showCancel: false,
        confirmText: '我知道了'
      });
    })
  },
  clearText(){
    text = "";
    bindText = '';
    this.setData({ textContent: '', isInputTextHidden: true });
  },
  // onShareAppMessage: function (res) {
  //   return {
  //     title: '大头贴动画制作',
  //     imageUrl: "/static/basicprofile.png"
  //   }
  // },
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
    textContent: '',
    tipPreview: '点击“预览”按钮后，长按GIF图片可保存至本地相册',
    cameraError: false,
    // showShare: false,
    finishGifPath: null,
    isInputTextHidden: true,
    cam_position: '前置',
    btnDisabled: false,
    showPreview: "false",
    image_count: 0,
    fps: '4帧',
    fps_id: 4,
    fpsArray: ['1帧/秒', '2帧/秒', '3帧/秒', '4帧/秒', '5帧/秒', '6帧/秒', '7帧/秒', '8帧/秒', '9帧/秒', '10帧/秒', '11帧/秒', '12帧/秒'],
    imageSize: 300,
    imgSize: '300px',
    imgSizeId: 6,
    imgSizeArray: ["图宽50px", "图宽80px", "图宽100px", "图宽150px", "图宽200px", "图宽250px", "图宽300px", "图宽350px", "图宽400px", "图宽450px"],
    previewMode: "scaleToFill",
    textColorId: 0,
    textColor: '白色',
    textColorArray: ['白色', '黑色', '红色', '黄色', '绿色', '蓝色'],
    photos: [],
    tool_tip: '点击拍照按钮添加照片'
  },
  previewGif: function(){
    if (this.data.showPreview == "") {
      this.closePreviewDialog();
      return;
    }
    //如果已经生成过gif，直接预览
    if(this.data.finishGifPath){
        this.showPreviewDialog();
    }else{
      wx.showModal({
        title: '提示',
        content: "请先制作Gif",
        showCancel: false,
      });
    }
  },
  createGif: function(){
    let count = photos.length;
    if(count <= 1){
      var msg = "至少拍摄两张照片";
      if (count == 0) {
        msg = "请先拍摄照片";
      }
      wx.showToast({icon:'none', title: msg, });
      return;
    }

    tmpPhotos.length = 0;
    this.addImage(()=>{
      //生成gif
      this.showLoading("初始化GIF...");
      create(this.data.imageSize, this.data.imageSize, parseInt(this.data.fps.replace('帧', '')));
      for(var i=0; i<count; i+=1){
        wx.showLoading({
          title: "GIF制作中(" + i + "/" + count + ")",
          mask: true,
        });
        var genPath = getApp().globalData.userDataPath + "gen" +i+".png";
        try {
          var result = wx.getFileSystemManager().readFileSync(genPath);
          console.log("读取图片:", genPath, result);
          addPng(new Uint8ClampedArray(result));
        } catch (e) {
          console.log("图片读取失败：", e);
        }
      }

      var result = getFile();

      if (!result || result.length==0) {
        this.showError("Gif制作失败，请重试！");
        wx.hideLoading();
        return;
      }

      const fileData = new Uint8Array(result);
      result = null;

      //console.log("GIF制作完成:", msg);
      //const fileData = new Uint8Array(fileData);
      //保存制作完成的gif
      let fsm = wx.getFileSystemManager();
      this.showLoading("保存临时文件...");
      let filePath = `${wx.env.USER_DATA_PATH}/` + 'create.gif';
      try {
        fsm.writeFile({
          filePath: filePath, data: fileData.buffer,
          success: (res)=> {
              this.setData({ finishGifPath: filePath, photos });
              this.showPreviewDialog();
              tmpPhotos.length = 0;
          },
          fail: (res) => {
            wx.hideLoading();
            this.showError('临时文件保存失败!' + JSON.stringify(res));
          },
          complete: (res)=> {}
        });
      } catch (e) {
        wx.hideLoading();
        this.showError('图片读取失败!' + JSON.stringify(e));
      }
    });
  },
  clearImage: function(){
    photos.length = 0;
    this.setData({ photos: photos, finishGifPath: null, });
    this.saveData();
    //清空文件
    let filePath = `${wx.env.USER_DATA_PATH}/` + 'create.gif';
    let fsm = wx.getFileSystemManager();
    fsm.unlink({
      filePath,
      success:(res)=>{
        console.log('文件删除成功:', res);
      },
    });
    wx.showToast({icon:'none', title: '文件已删除', });
  },
  //一次性给GIF制作器添加所有图片
  addImage: function(cb){
    //添加一张照片
    if(tmpPhotos.length == photos.length){
      cb();
      return;
    }
    //选出当前要添加的图片
    var nextId = tmpPhotos.length;
    var photo = photos[nextId];
    this.showLoading("保存图片" + tmpPhotos.length + "/" + photos.length);
    wx.getImageInfo({
      src: photo.path,
      success:(res)=> {
        let width = this.data.imageSize;
        let height = this.data.imageSize / res.width * res.height;
        let top = (this.data.imageSize - height) / 2;
        canvasContext.drawImage(photo.path, 0, top, width, height);
        canvasContext.setFillStyle(textColor);
        canvasContext.setFontSize(this.data.imageSize / 8);
        canvasContext.fillText(text, 10, this.data.imageSize - (this.data.imageSize / 7), this.data.imageSize);

        canvasContext.draw(false, ()=> {
          var fileType = 'png';
          var obj = {
            x: 0,
            y: 0,
            width: this.data.imageSize,
            height: this.data.imageSize,
            destWidth: this.data.imageSize,
            destHeight: this.data.imageSize,
            canvasId: 'canvas',
            fileType: fileType,
            success: (res)=> {
              // console.log("图片保存成功：", res);
              var tmpPath = res.tempFilePath;
              var savePath = `${wx.env.USER_DATA_PATH}/` + 'gen' + nextId + '.' + fileType;
              wx.getFileSystemManager().saveFile({
                tempFilePath: tmpPath,
                filePath: savePath,
                success:(res)=> {
                  tmpPhotos.push(res.savedFilePath);
                  console.log("图片文件保存成功:", res.savedFilePath);
                  //保存下一张
                  this.addImage(cb);
                }
              });
            },
            fail: (res)=> {
              this.showError('图片保存失败，请重试！');
            }
          };
          wx.canvasToTempFilePath(obj);
          
        });
      },
      fail: (res)=>{
        wx.hideLoading();
        tmpPhotos.length = 0;
        this.showError('图片保存失败，请重试！');
        this.clearImage();
      }
    });
  },
  //从相册选择照片
  chooseImage: function(){
    wx.chooseMedia({
      count: 1,
      sizeType: ['compressed'],
      mediaType: ['image'],
      sourceType: ['album'],
      maxDuration: 30,
      camera: 'back',
      success: res => {
        console.log('图片选择完成:', res);
        if (res.tempFiles && res.tempFiles.length>0){
          var filePath = res.tempFiles[0].tempFilePath;
          this.checkAddImage(filePath);
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
  checkAddImage(srcFilePath, onFinish){
    console.log('checkAddImage之前 photos:', JSON.stringify(photos));
    //审查图片
    this.showLoading('正在验证图片');

    //压缩图片
    const filePath = `${wx.env.USER_DATA_PATH}/` + 'small_image.jpg';

    let checkOk = ()=>{
      wx.hideLoading();
      photos.push({ path: srcFilePath, valid: true, });
      console.log('checkAddImage之前 photos:', JSON.stringify(photos));
      this.setData({ photos });
      if(onFinish){ onFinish()};
    };

    let checkError = (e)=>{
      if(onFinish){ onFinish()};
      wx.hideLoading();
      console.error('图片审查失败', e);
      wx.showModal({
        title: '提示',
        content: "图片审查失败，请更换",
        showCancel: false,
      });
    };
    
    this.resizeImageTo(srcFilePath, filePath, 'jpg').then(() => {
      imgSecCheck.checkImage(filePath).then(()=>{
        checkOk();
      }).catch(e => {
        console.error('checkImage=>', e);
        checkError();
      });
    }).catch(e => {
      console.error('resizeImageTo', e);
      checkError();
    })
  },
  takePhoto: function(){
    //禁止拍照按钮
    this.setData({ btnDisabled: true});
    cameraContext.takePhoto({
      quality: 'normal',
      success: (res) => {
        this.checkAddImage(res.tempImagePath, ()=>{
          this.setData({ btnDisabled: false });
          var strs = [
            '微微移动相机、调高帧率，使动画更流畅',
            '如果无法拍照，请退出小程序并重新进入'];
          var change = Math.random() < 0.3;
          if (change) {
            let rand = Math.random();
            if (rand < 0.4) {
              tipId = 0;
            } else if (rand > 0.4 && rand < 0.8) {
              tipId = 1;
            } else {
              tipId = 2;
            }
          }
          this.setData({ tool_tip: strs[tipId] }); 
        });
      },
      fail: (res)=> {
        this.setData({ btnDisabled: false });
        this.showError('拍照失败!' + JSON.stringify(res));
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
    this.setData({ imgSizeId: res.detail.value, imgSize: this.data.imageSize+'px' });
  },
  bindTextColorChange: function(res){
    textColor = textColors[res.detail.value];
    this.setData({ textColor: this.data.textColorArray[res.detail.value], textColorId: res.detail.value });
  },
  onClose: function(){
    nextShowTime = 0;
  },
  onShow: function(){
    console.log('cameraContext=', cameraContext);
    if(!cameraContext){
      cameraContext = wx.createCameraContext();
    }
    this.setData({ btnDisabled: false });
    console.log("nextShowTime=", nextShowTime);
    //1分钟显示一次广告
    if (this.data.finishGifPath && new Date().getTime() > nextShowTime) {
      if (interstitialAd) {
        nextShowTime = new Date().getTime() + 1000 * 60;
        interstitialAd.show().catch((err) => {
          nextShowTime -= 1000 * 60;
          console.error(err)
        });
      }
    } else {
      if (!this.data.finishGifPath) {
        console.log("用户未使用，不显示广告");
      } else {
        console.log("时间未到，不显示广告");
      }
    }
  },

  showPreviewDialog: function(){
    // this.showLoading("读取图片");
    //这里有缓存
    //this.setData({ previewMode: previewMode, showPreview: "", previewGifPath: this.data.finishGifPath+"?"+Math.random()});
    this.previewImage();
    // const base64 = wx.arrayBufferToBase64(res.data);
  },
  closePreviewDialog: function(){
    this.setData({ showPreview: "false" });
  },
  previewImage: function(){
    this.showLoading("正在预览");
    wx.previewImage({
      urls: [this.data.finishGifPath],
      complete: function(){
        wx.hideLoading();
      }
    });
  },
  deletePhoto: function(event){
    var path = event.target.dataset.id;
    var del_id = -1;
    for(var p in photos){
      if(photos[p].path == path){
        del_id = p;
        break;
      }
    }
    photos.splice(del_id, 1);
    this.setData({ photos: photos });
  },

  // showShare: function () {
  //   this.setData({showShare: true });
  // },
  // hideShare: function () {
  //   this.setData({showShare: false });
  // },
  requestCameraAuth(){
    wx.openSetting({
      success: (res)=> {
        if(res.authSetting['scope.camera']){
          this.setData({ cameraError:false})
        }
      }
    });
  },
  closeTipPreview(){
    wx.showModal({
      title: '提示',
      confirmText: '不再提示',
      content: this.data.tipPreview,
      success: (res)=> {
        if (res.confirm) {
          this.setData({
            hideTipPreview: true,
          });
          this.saveData();
        }
      }
    });
  },
  //压缩图片
  resizeImageTo(path, savePath, fileType){
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: path,
        success:(res)=> {
          let width = this.data.imageSize;
          let height = this.data.imageSize / res.width * res.height;
          let top = (this.data.imageSize - height) / 2;
          canvasContext.drawImage(path, 0, top, width, height);
          canvasContext.setFillStyle(textColor);
          canvasContext.setFontSize(this.data.imageSize / 8);
          canvasContext.fillText(text, 10, this.data.imageSize - (this.data.imageSize / 7), this.data.imageSize);
  
          canvasContext.draw(false, ()=> {
            var obj = {
              x: 0,
              y: 0,
              width: this.data.imageSize,
              height: this.data.imageSize,
              destWidth: this.data.imageSize,
              destHeight: this.data.imageSize,
              canvasId: 'canvas',
              fileType: fileType,
              success: (res)=> {
                // console.log("图片保存成功：", res);
                var tmpPath = res.tempFilePath;
                wx.getFileSystemManager().saveFile({
                  tempFilePath: tmpPath,
                  filePath: savePath,
                  success:(res)=> {
                    console.error('resizeImageTo成功', res);
                    resolve();
                  }
                });
              },
              fail: (res)=> {
                console.error('resizeImageTo 出错', res);
                reject();
              }
            };
            wx.canvasToTempFilePath(obj);
          });
        },
        fail: (res)=>{
          console.error('resizeImageTo 出错', res);
          reject();
        }
      });
    });
  },

  goMiniprogram(){
    wx.navigateToMiniProgram({
      appId: 'wxf6f4b4ee979ccb85',
      path: 'pages/mine/walkinCoupon/walkinCoupon?storeId=9&couponId=1240',
      // envVersion: 'develop',
      success(res) {
        // 打开成功
      }
    })
  },
})