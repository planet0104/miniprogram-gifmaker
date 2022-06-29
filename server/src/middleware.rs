use std::future::{ready, Ready};

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, http::header::HeaderMap, error,
};
use chrono::Utc;
use futures_util::future::LocalBoxFuture;
use log::{error, info};
use magic_crypt::{new_magic_crypt, MagicCryptTrait};
use crate::constant::{SECRET_KEY, SECRET_IV};

// 中间件处理有两个步骤。
// 1. 中间件初始化，中间件工厂以链中的下一个服务作为参数被调用。
// 2. 中间件的调用方法被正常请求调用。
pub struct Authentication;

// 中间件工厂是 `Transform` trait
// `S` - 下一个服务的类型
// `B` - 响应正文的类型
impl<S, B> Transform<S, ServiceRequest> for Authentication
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthenticationMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthenticationMiddleware { service }))
    }
}

pub struct AuthenticationMiddleware<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for AuthenticationMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        
        match check_secret(req.headers()){
            Ok(()) => {
                let fut = self.service.call(req);

                Box::pin(async move {
                    Ok(fut.await?)
                })
            },
            Err(err) => {
                error!("check_secret: {:?}", err);
                Box::pin(async move {
                    Err(error::ErrorBadRequest(format!("{err}")))
                })
            }
        }
    }
}

fn check_secret(headers: &HeaderMap) -> anyhow::Result<()>{
    match headers.get("secret"){
        None => {
            Err(anyhow::anyhow!("no secret!"))
        },
        Some(secret) => {
            // secret: 当前时间戳字符串 -> bytes -> 加密 -> base64
            let secret = secret.to_str()?;
            info!("secret={}", secret);

            let crypt = new_magic_crypt!(SECRET_KEY, 128, SECRET_IV);

            let timestamp_str = crypt.decrypt_base64_to_string(secret)?;
            
            let timestamp:i64 = timestamp_str.parse()?;

            let now = Utc::now().timestamp_millis();

            // 5秒之内
            if (timestamp - now).abs() > 5000{
                return Err(anyhow::anyhow!("secret error! secret={}", secret));
            }

            Ok(())
        }
    }
}