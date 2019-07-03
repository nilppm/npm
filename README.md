# Node's internal lightweight private package manager

简称`NILPPM`。它是一套基于nodejs轻量的私有源管理程序。它为您提供一整套标准的企业内部包管理方案，兼容NPM命令行。它与[CNPM](https://github.com/cnpm/cnpm)的区别主要是以下几点：

1. 职责专一：只对私有包进行管理。
2. 不涉及同步模式，同步模式带来的磁盘开销太大。
3. 相比之下，在路由层速度有先天优势（nilppm通过`radix tree`算法实现，而CNPM则通过KOA-ROUTER实现）。
4. 超级简单的安装部署。

`NILPPM`程序基于[NELTS](https://github.com/nelts)架构实现，有着稳定的性能。感兴趣的小伙伴可以前往链接查看。

# 快速安装

您不必为安装烦恼，`NILPPM`提供最便捷的安装模式和升级模式，请跟着我们的步骤操作即可完成安装。

## 第一步

确定您存放私有包的目录，比如我们存放在`/usr/local/nilppm`路径上。那么：

```bash
$ cd /usr/local/nilppm
```

## 第二步

创建一个`package.json`来描述这个仓库程序。

```bash
$ npm init
```

比如我们创建了如下的信息

```json
{
  "name": "npm",
  "version": "1.0.0",
  "description": "",
  "main": "nilppm.config.js",
  "author": "",
  "license": "ISC"
}
```

## 第三步

安装我们的程序包，通过NPM直接安装

```bash
$ npm i @nilppm/npm
$ npm i -g pm2
```

## 第四步

在`package.json`中写入命令

```json
{
  // ...
  "scripts": {
    "start": "nilppm start -m 1 -p 9000 && pm2 logs",
    "restart": "nilppm restart",
    "stop": "nilppm stop"
  },
  // ...
}
```

这里的`start`命令参数：

- `-m, --max <count>` 启动时候子进程个数。
- `-p, --port <port>` 启动服务的端口。

它是基于[PM2](https://www.npmjs.com/package/pm2)守护进程的，所以能够使用`PM2`的所有命令。

## 第五步

写入配置参数

在当前目录下新建一个`nilppm.config.js`文件，写入如下的配置

```javascript
module.exports = {
  // sequelize配置参数请参考 http://docs.sequelizejs.com/manual/dialects.html
  sequelize: {
    database: 'cpm',
    username: 'shenyj',
    password: '!2!34ffh!rfRg89_',
    options: {
      dialect: 'mysql',
      host: '192.168.2.181',
      pool: {
        max: 10,
        min: 3
      }
    }
  },
  // 需要redis支持来缓存数据
  redis: '192.168.2.208:6379',
  // 本服务对外暴露绑定的域名，注意：需要带上http://
  registryHost: 'http://127.0.0.1:8080',
  // NPM允许上传的私有scope数组
  scopes: ['@html5', '@node'],
  // 当不指定用户体系的时候，我们可以直接指定邮箱后缀来生成用户
  defaultEmailSuffix: '@example.com',
  // 管理员账户足
  admins: ['shenyunjie'],
  // 当我们使用自定义用户体系的时候，
  // 我们需要提供一个获取用户信息的接口
  // 这个不是必须，是可选参数函数。
  async getUserInfo(account) {},
  // 当我们使用自定义用户体系的时候，
  // 我们需要提供一个验证用户是否为有效用户的接口
  // 这个不是必须，是可选参数函数。
  async userLogin(account, password, currentdate){},
}
```

注意：`getUserInfo`和`userLogin`接口都必须返回一下数据结构

```json
{
  "account": "用户账号",
  "name": "用户昵称",
  "email": "用户邮箱",
  "avatar": "用户头像地址",
  "scopes": ["用户具有的scope组", "必须以@开头"],
  "extra": {} // 用户额外数据
}
```

## 第六步

通过以下命令启动

```bash
$ npm run start # 启动
$ npm run restart # 重启
$ npm run stop # 停止
```

# 更新

更新方式变的非常简单

```bash
$ npm update # 更新程序
$ npm run restart # 重启服务
```


# License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, yunjie (Evio) shen
