# Camera Hit Arena

这是一个最小可运行的“拍照判定 + 2 秒冷却”的娱乐型原型，适合做多人手机联机演示。它的设计目标是：

- 攻击者按下拍照
- 使用当前那一帧画面做命中判定
- 识别是否检测到人脸，并判断人脸是否落在画面中心区域
- 命中则发给服务器，目标 HP 下降 25
- 攻击者必须等待 2 秒冷却后才能再次拍照

## 运行方式

1. 安装依赖

```bash
npm install
```

2. 启动服务

```bash
npm start
```

3. 在浏览器中打开

```text
http://localhost:3000
```

4. 在两台设备上使用同一个房间名（例如 room-1）

- 一台设置为“攻击者”
- 一台设置为“目标”

## 说明

这是第一版原型，重点是：

- 单帧拍照判定
- 2 秒冷却
- 局域网 / 设备之间联机同步
- 可扩展为 iOS / Android 互通版本

后续如果你要做完整移动端版本，可以把这套 Socket 后端直接复用到 Flutter / Kotlin / Swift 项目里。

## 技术栈

- Node.js
- Express
- Socket.IO
- MediaPipe Face Detection（浏览器端）

## 适合的演示场景

- 两个手机同一房间内
- 人脸中心区域命中判定
- 轻量型互动游戏原型

## 目录结构

```text
.
├── public/
│   └── index.html
├── package.json
├── server.js
├── README.md
└── .gitignore
```
