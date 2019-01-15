# miniprogram-gifmaker

GIF动画制作微信小程序

<img width="200" height="200" src="https://github.com/planet0104/miniprogram-gifmaker/blob/master/code0.jpg" />
<img src="https://github.com/planet0104/miniprogram-gifmaker/blob/master/code1.jpg" />

其中GIF生成的功能是用Rust实现的，目录结构如下：

<b>/ministdweb</b> Rust代码

<b>/program</b> 微信小程序代码

program中的代码可以直接在微信开发工具编译运行，/workers/ministdweb.js是编译好的Rust代码。

<img src="https://github.com/planet0104/miniprogram-gifmaker/blob/master/screenrecorder.gif" />
<img src="https://github.com/planet0104/miniprogram-gifmaker/blob/master/screenshot.jpg" />


Rust代码使用的第三方库：

https://crates.io/crates/stdweb

https://crates.io/crates/gif

https://crates.io/crates/png