use anyhow::Result;
use env_logger::{Builder, Target};
use sec_check::{msg_sec_check, CheckResult, img_sec_check};
use spin_sdk::{
    http::{Request, Response},
    http_component,
};

use tools::{bytes_to_string, bytes_to_vec};
mod tools;
mod sec_check;
mod secret;
mod token;

#[http_component]
fn wx_sec_check(req: Request) -> Result<Response> {

    let mut builder = Builder::from_default_env();
    builder.target(Target::Stdout);
    builder.filter_level(log::LevelFilter::Info);
    builder.init();

    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            let res = match main(req).await{
                Err(err) => {
                    CheckResult{
                        errcode: -1,
                        errmsg: format!("{:?}", err)
                    }
                }
                Ok(res) => res
            };
            let res_data = serde_json::to_string(&res)?;
            return Ok(http::Response::builder()
            .status(200)
            .body(Some(res_data.into()))?);
        })
}

async fn main(req: Request) -> Result<CheckResult>{

    let _ = secret::check_secret(req.headers())?;
    
    let query_str = format!("info={:?}", req.uri().query());

    if req.body().is_none(){
        return Ok(CheckResult{
            errcode: -1,
            errmsg: format!("body is none")
        });
    }

    if query_str.contains("type=msg"){
        let msg = bytes_to_string(req.body())?;
        msg_sec_check(&msg).await
    }else{
        let img = bytes_to_vec(req.body())?;
        img_sec_check(img).await
    }
}