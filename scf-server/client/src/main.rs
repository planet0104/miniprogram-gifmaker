use anyhow::Result;
use headers::Date;
use reqwest::header::{HeaderMap, HeaderValue};
use serde_json::json;
use instant::SystemTime;

//API网关绑定的密钥对
const SECRET_ID: &str = env!("gifmaker_SecretId");
const SECRET_KEY: &str = env!("gifmaker_SecretKey");

#[tokio::main]
async fn main() -> Result<()> {
    println!("SECRET_ID={SECRET_ID}");
    println!("SECRET_KEY={SECRET_KEY}");

    let date_time = Date::from(SystemTime::now());

    let date_time = format!("{:?}", date_time).replace("Date(", "").replace(")", "");

    let source = "gifmaker";
    let auth = format!(
        "hmac id=\"{SECRET_ID}\", algorithm=\"hmac-sha1\", headers=\"x-date source\", signature=\""
    );
    let sign_str = format!("x-date: {date_time}\nsource: {source}");

    println!("auth={auth}");
    println!("sign_str={sign_str}");

    let sign = hmacsha1::hmac_sha1(SECRET_KEY.as_bytes(), sign_str.as_bytes());
    let sign = base64::encode(sign);
    println!("sign={sign}");
    let sign = format!("{auth}{sign}\"");

    println!("Authorization={sign}");

    let mut headers = HeaderMap::new();
    headers.append("Source", HeaderValue::from_str(source)?);
    headers.append("X-Date", HeaderValue::from_str(&date_time.to_string())?);
    headers.append("Authorization", HeaderValue::from_str(&sign)?);

    println!("headers ok.");

    let client = reqwest::Client::new();

    let msg = "xxx";
    let img = include_bytes!("../test.png");

    println!("msg={msg}");

    let res = client
        .post("https://service-n6jh85tz-1256376761.sh.apigw.tencentcs.com/release/gifmaker")
        .headers(headers)
        .json(&json!({ "img": base64::encode(img) }))
        .send()
        .await?
        .text()
        .await?;

    println!("审查结果:{:?}", res);

    Ok(())
}


/*

Rust:

auth=hmac id="AKIDit9ZtFoaB6J7wX9Xq0ofFjNXokD5h1MNOs2A", algorithm="hmac-sha1", headers="x-date source", signature="
sign_str=x-date: Sat, 05 Mar 2022 07:59:09 GMT
source: gifmaker
sign=Q/vwUFo8dRVfxa6cmfAX2BHPVQM=

Authorization=hmac id="AKIDit9ZtFoaB6J7wX9Xq0ofFjNXokD5h1MNOs2A", algorithm="hmac-sha1", headers="x-date source", signature="Q/vwUFo8dRVfxa6cmfAX2BHPVQM="

js:
auth= hmac id="AKIDit9ZtFoaB6J7wX9Xq0ofFjNXokD5h1MNOs2A", algorithm="hmac-sha1", headers="x-date source", signature="
signStr= x-date: Sat, 05 Mar 2022 07:59:09 GMT
source: gifmaker

sign1=43fbf0505a3c75155fc5ae9c99f017d811cf5503
sign2=Q/vwUFo8dRVfxa6cmfAX2BHPVQM=

Authorization=hmac id="AKIDit9ZtFoaB6J7wX9Xq0ofFjNXokD5h1MNOs2A", algorithm="hmac-sha1", headers="x-date source", signature="Q/vwUFo8dRVfxa6cmfAX2BHPVQM="

toUTCString = Sat, 05 Mar 2022 13:47:12 GMT
*/