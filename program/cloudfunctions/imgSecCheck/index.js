'use strict';

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = (event, context, callback) => {
  //校验图片是否含有违法违规内容
  //console.log("event=", event.file);
  var buffer = Buffer.from(event.file.data);
  //console.log("buffer=", buffer);
  try {
    return cloud.openapi.security.imgSecCheck({
      media: {
        contentType: 'image/' + event.imgType,
        value: buffer
      }
    })
  } catch (e) {
    e.imgType = event.imgType;
    return e;
  }
};
