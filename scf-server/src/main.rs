use anyhow::Result;
use log::{error, info, LevelFilter};

mod config;
mod token;
mod sec_check;
use config::CONFIG;
use reqwest::Response;
use serde_json::{json, Value};
use tokio::{time::{ sleep, Duration }};
use sec_check::*;

#[tokio::main]
async fn main(){
    env_logger::init();
    
    // env_logger::Builder::new()
    // .filter_level(LevelFilter::Debug)
    // .init();

    //通知初始化成功
    let _ = post_data(&CONFIG.ready_url, &json!({ "msg": "rust ready"})).await;

    loop{
        //循环读取事件
        match reqwest::get(&CONFIG.event_url).await{
            Ok(response) => {
                if let Err(err) = process_event(response).await{
                    let err_res = post_data(&CONFIG.error_url, &json!({"msg": format!("{:?}", err)})).await;
                    error!("event 处理失败 {:?} res={:?}", err, err_res);
                }
            }
            Err(err) => {
                error!("event 读取失败 {:?}", err);
                sleep(Duration::from_millis(1000)).await;
            }
        }
    }
}

async fn process_event(response: Response) -> Result<()> {
    let mut event: Value = response.json().await?;

    info!("获取到event:{event}");

    // 网关api数据存储在body字段中
    let body_str = event["body"].as_str().unwrap_or("");
    if body_str.len() > 0{
        if let Ok(e) = serde_json::from_str(body_str){
            event = e;
        }
    }

    /*
    提交数据:
    {
        img: base64字符串,
        msg: 字符串
    }
     */
    let mut pass = false;
    let mut errno = -1;
    let mut error = String::new();

    let img = event["img"].as_str().unwrap_or("");
    let msg = &event["msg"].as_str().unwrap_or("");

    if img.len()>0{
        match img_sec_check_base64(img).await{
            Ok(b) => {
                pass = b;
                errno = 0;
            },
            Err(err) => error = format!("{err}")
        };
    }else if msg.len()>0{
        match msg_sec_check(msg).await{
            Ok(b) => {
                pass = b;
                errno = 0;
            },
            Err(err) => error = format!("{err}")
        };
    }else{
        error = "缺少img或msg参数: {msg: '', img: ''}".to_string();
    }

    //两个检查
    let resp = json!({
        //0成功，其他错误
        "errno" : errno,
        //错误信息
        "error" : error,
        //是否通过
        "pass" : pass,
    });

    let data = post_data(&CONFIG.response_url, &json!({
        "isBase64Encoded": false,
        "statusCode": 200,
        "headers": {"Content-Type":"application/json"},
        "body": resp.to_string()
    })).await?;
    info!("invoke response: {data}");
    Ok(())
}

async fn post_data(url: &str, data: &Value) -> Result<String> {
    let client = reqwest::Client::new();
    info!("返回数据:{:?}", data);
    let res = client.post(url).json(data).send().await?;
    Ok(res.text().await?)
}
