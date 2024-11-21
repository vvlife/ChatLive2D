# ChatLive2D桃芝

![](https://forthebadge.com/images/badges/built-with-love.svg)
![](https://forthebadge.com/images/badges/uses-html.svg)
![](https://forthebadge.com/images/badges/made-with-javascript.svg)
![](https://forthebadge.com/images/badges/contains-cat-gifs.svg)
![](https://forthebadge.com/images/badges/powered-by-electricity.svg)
![](https://forthebadge.com/images/badges/makes-people-smile.svg)

## 特性

通过网页访问ChatLive2D桃芝，对接了AI聊天功能。

（注：以上人物模型仅供展示之用，本仓库并不包含任何模型。）

DEMO: http://110.41.159.171/

关于Live2D，你也可以查看示例网页（不支持AI聊天）：
- [demo.html](https://stevenjoezhang.github.io/live2d-widget/demo/demo.html)，展现基础功能
- [login.html](https://stevenjoezhang.github.io/live2d-widget/demo/login.html)，仿 NPM 的登陆界面

## 部署

要在本地部署本项目环境，你需要安装 Node.js（https://nodejs.org/en） 和 npm，然后执行以下命令：

### 前端编译

```bash
git clone https://github.com/vvlife/ChatLive2D.git
npm install
npm run build
```

### 启动后端

下载ollama: https://ollama.org.cn
启动模型：
```bash
ollama run qwen2.5:0.5b
```
访问检查：http://localhost:11434
看到Ollama is running即为成功

### 启动路由(默认80端口)

```bash
cd ChatLive2D
node proxyServer.cjs
```

### 使用
本地启动后浏览器中访问localhost即可,角色在电脑端可以拖动

如果不使用默认设置，要改端口或者路径则需要修改（路径末尾的 `/` 一定要加上。）
1. `autoload.js` 中的常量 `live2d_path`
2. `proxyServer`最下面的`app.listen(80...`中的80改为你想要的端口
3. `index.html`中的路径

## 鸣谢

live2d-widget: 可交互式Live2D网页看板娘插件
ollama: 使用大型语言模型开始您的旅程

## 更多

更多内容可以参考：  
https://www.dongaigc.com/p/stevenjoezhang/live2d-widget
https://ollama.org.cn

## 许可证

Released under the GNU General Public License v3  
http://www.gnu.org/licenses/gpl-3.0.html

本仓库并不包含任何模型，用作展示的所有 Live2D 模型、图片、动作数据等版权均属于其原作者，仅供研究学习，不得用于商业用途。

Live2D 官方网站：  
https://www.live2d.com/en/  
https://live2d.github.io

Live2D Cubism Core は Live2D Proprietary Software License で提供しています。  
https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html  
Live2D Cubism Components は Live2D Open Software License で提供しています。  
http://www.live2d.com/eula/live2d-open-software-license-agreement_en.html

> The terms and conditions do prohibit modification, but obfuscating in `live2d.min.js` would not be considered illegal modification.

https://community.live2d.com/discussion/140/webgl-developer-licence-and-javascript-question
