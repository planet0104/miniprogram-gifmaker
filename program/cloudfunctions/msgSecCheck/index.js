// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  //校验文本是否含有违法违规内容
  console.log("event=", event.text);

  return cloud.openapi.security.msgSecCheck({
    content: event.text
  });
};