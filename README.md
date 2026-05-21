# QuarkDownloader

夸克网盘下载助手 — 油猴脚本，支持分享页面和个人网盘的批量文件下载。

## 功能

- 分享页面一键下载，支持多选文件和文件夹
- 保持原始目录结构下载
- 多种下载方式：IDM / Motrix / aria2 / cURL
- 保存下载（保留转存文件）和无痕下载（下载后自动清理）
- 树形结构展示文件，支持复选框批量选择

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击 [quark-downloader.js](./My/QuarkDownloader/quark-downloader.js) 安装脚本

## 使用

1. 打开夸克网盘分享链接或个人网盘页面
2. 点击页面上的「下载助手」按钮
3. 勾选要下载的文件/文件夹
4. 选择下载方式

## 下载方式说明

| 方式 | 说明 |
|------|------|
| IDM | 通过 IDM 浏览器扩展拦截下载 |
| Motrix | 通过 Motrix RPC 或协议调用 |
| aria2 | 生成 aria2c 命令复制到剪贴板 |
| cURL | 生成 curl 命令复制到剪贴板 |

## 下载模式

- **保存下载**：文件转存到网盘「来自：分享」目录后获取下载链接，转存文件保留
- **无痕下载**：同保存下载，但下载完成后自动删除转存文件

## License

MIT   
欢迎来[linux.do](https://linux.do/)社区交流、分享和反馈。
