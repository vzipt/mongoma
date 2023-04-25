# mongoma

[![NPM version](https://img.shields.io/npm/v/mongoma.svg?style=flat)](https://npmjs.org/package/mongoma)
[![NPM downloads](http://img.shields.io/npm/dm/mongoma.svg?style=flat)](https://npmjs.org/package/mongoma)

mongoma 是一个用于自动下载、安装和管理 MongoDB 服务器的 Node.js 包。它可以帮助您在项目中快速配置和使用 MongoDB 服务器，无需手动下载、安装或配置。
也可以在 electron 项目中安装， 支持跨平台下载打包


## 功能

- 根据当前系统自动下载对应版本的 MongoDB 服务器
- 在项目中轻松设置和管理 MongoDB 服务器
- 支持多种操作系统（包括 Windows、macOS 和 Linux）
- 支持项目根目录或子项目中的 MongoDB 服务器安装
- 提供易于使用的 API 以管理 MongoDB 服务器

## 安装

使用 npm 或 pnpm 安装：
```sh
npm install mongoma
```
或
```sh
pnpm add mongoma
```
> 安装成功后会在项目根目录下载一个 `mongo` 文件夹，里面包含当前开发平台的 mongodb server，所有平台版本统一为 `6.0.5`

### workspace 子项目安装 
在 workspace 项目中可在下载包之前在项目根目录创建 `.mongomarc`文件， 用`mongoServerRoot`字段指定`mongodb`安装目录。如：
```json
{
  "mongoServerRoot": "./packages/xxx"
}
```
## 启动 mongodb服务
```typescript
import mongoma from 'mongoma';
const mongo = new mongoma();
mongo.start();
```


## 问题与建议
请打开一个问题 [这里](https://github.com/vzipt/mongoma/issues).

## LICENSE
MIT
