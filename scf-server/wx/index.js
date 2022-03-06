'use strict';

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

async function deleteFile(fileID){
  const fileIDs = [fileID]
  const result = await cloud.deleteFile({
    fileList: fileIDs,
  })
  // console.log("文件已删除:", result);
  return result.fileList;
}

exports.main = async (event, context, callback) => {
  //校验图片是否含有违法违规内容
  //console.log("event=", event.file);
  var fileID = event.fileID;
  var imgType = event.imgType;

  //console.log("fileID=", fileID, "imgType=", imgType);
  
  const res = await cloud.downloadFile({
    fileID: fileID,
  })
  const buffer = res.fileContent;

  //console.log("buffer=", buffer);
  try {
    var r = cloud.openapi.security.imgSecCheck({
      media: {
        contentType: 'image/' + imgType,
        value: buffer
      }
    });
    deleteFile(fileID);
    return r;
  } catch (e) {
    deleteFile(fileID);
    e.imgType = imgType;
    return e;
  }
};
