# Node's internal lightweight private package manager

简称`NILPPM`。它是一套基于nodejs轻量的私有源管理程序。它为您提供一整套标准的企业内部包管理方案，兼容NPM命令行。它与[CNPM](https://github.com/cnpm/cnpm)的区别主要是以下几点：

1. 职责专一：只对私有包进行管理。
2. 不涉及同步模式，同步模式带来的磁盘开销太大。
3. 相比之下，在路由层速度有先天优势（nilppm通过`radix tree`算法实现，而CNPM则通过KOA-ROUTER实现）。
4. 超级简单的安装部署。

`NILPPM`程序基于[NELTS](https://github.com/nelts)架构实现，有着稳定的性能。感兴趣的小伙伴可以前往链接查看。

# 前提

Nilppm 依赖 [pm2](https://www.npmjs.com/package/pm2) 进程守护，请优先安装：

```bash
$ npm i -g pm2
$ pm2 install pm2-intercom
```

# 快速安装

您不必为安装烦恼，`NILPPM`提供最便捷的安装模式和升级模式，请跟着我们的步骤操作即可完成安装。

```bash
$ git clone git@github.com:nilppm/registry.git
$ cd registry
$ rm -rf .git
$ npm ci
```

> 依赖安装完毕请修改配置文件 `nilppm.config.js`。具体配置参数说明见`手动安装`文档。

# 手动安装

手动安装过程页非常方便，请按照以下步骤进行。

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
```

## 第四步

在`package.json`中写入命令

```json
{
  // ...
  "scripts": {
    "start": "nilppm start -p 9000 && pm2 logs",
    "restart": "nilppm restart",
    "stop": "nilppm stop"
  },
  // ...
}
```

这里的`start`命令参数：

- `-m, --max <count>` 启动时候子进程个数。
- `-p, --port <port>` 启动服务的端口。
- `-l, --level <level>` 日志级别

它是基于[PM2](https://www.npmjs.com/package/pm2)守护进程的，所以能够使用`PM2`的所有命令。关于日志级别，请参考 [这里](https://github.com/nelts/nelts/blob/master/docs/introduction/dir.md#%E6%A0%B9%E7%9B%AE%E5%BD%95)

## 第五步

写入配置参数

在当前目录下新建一个`nilppm.config.js`文件，写入如下的配置

```javascript
module.exports = {
  // sequelize配置参数请参考 http://docs.sequelizejs.com/manual/dialects.html
  sequelize: {
    database: '',
    username: '',
    password: '',
    options: {
      dialect: 'mysql',
      host: '',
      pool: {
        max: 10,
        min: 3
      }
    }
  },
  // 需要redis支持来缓存数据
  redis: '192.168.2.xxx:6379',
  // 缓存前缀名
  redis_prefix: 'nilppm:npm',
  // 本服务对外暴露绑定的域名，注意：需要带上http://
  registryHost: 'http://127.0.0.1:9000',
  // NPM允许上传的私有scope数组
  scopes: ['@html5', '@node'],
  // 当不指定用户体系的时候，我们可以直接指定邮箱后缀来生成用户
  defaultEmailSuffix: '@example.com',
  // 管理员账户足
  admins: ['anyone'],
  // 是否开启下载量统计
  // 开启的话，下载时候速度略微慢一些
  statistics: false,

  // 当我们使用自定义用户体系的时候，
  // 我们需要提供一个获取用户信息的接口
  // 这个不是必须，是可选参数函数。
  // async getUserInfo(account) {},
  
  // 当我们使用自定义用户体系的时候，
  // 我们需要提供一个验证用户是否为有效用户的接口
  // 这个不是必须，是可选参数函数。
  // async userLogin(account, password, currentdate){},
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

我们内部使用举例额，可以适当参考下：

```javascript
{
  // 当我们使用自定义用户体系的时候，
  // 我们需要提供一个获取用户信息的接口
  // 这个不是必须，是可选参数函数。
  async getUserInfo(account) {
    const user = await ajax.get('/api/user/' + account);
    return {
      account: user.account,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      scopes: ['@' + account, ...this.scopes],
      extra: {
        department: Number(user.department),
        position: user.position,
        mobile: user.mobile,
        gender: Number(user.gender),
        isleader: Number(user.isleader),
        english_name: user.english_name,
        telephone: user.telephone,
        qr_code: user.qr_code,
        alias: user.alias
      }
    }
  },
  
  // 当我们使用自定义用户体系的时候，
  // 我们需要提供一个验证用户是否为有效用户的接口
  // 这个不是必须，是可选参数函数。
  async userLogin(account, password){
    await ajax.post('/api/user/cpm/login', { account, password });
    return await this.getUserInfo(account);
  },
}
```

`sequelize` 不局限使用mysql，所以只要`sequelize`支持的数据库，我们都可以使用。

### configs.npmLogin(ctx: NPMContext, v: number): Promise<any>

这是一个特殊的函数，用来做NPM:Login行为的HOOK函数。比如说上报登录次数，收集登录环境参数等。

```javascript
module.exports = {
  // ...
  npmLogin(ctx, v) {
    return ctx.sendLogger({
      npmVersion: v,
      body: ctx.request.body,
    });
  }
}
```

> 这个函数不是必须，而是可选，一般没什么用处，可以省略。

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

# 主题

前端界面项目在 [https://github.com/nilppm/web](https://github.com/nilppm/web)，你可以通过以下命令克隆项目

```bash
$ git clone https://github.com/nilppm/web
$ npm ci
```

- `npm run dev` 调试开发
- `npm run build` 打包。打包文件位于`dist`目录下。

> 后续会增加自定义主题功能，您可以通过修改这个源码打包出文件，放到您项目的根目录下来替换官方主题。

# 升级

之前的版本[CPM](https://github.com/cevio/cpm)停止维护，您可以选择这个稳定版本，我们提供从CPM升级到Nilppm的方案。

## 数据库

```sql
alter table maintainer ADD utime datetime NOT NULL;
CREATE INDEX idx_account ON user (account);
alter table version ADD mtime datetime NOT NULL;
CREATE INDEX idx_rev ON version (rev);
CREATE UNIQUE INDEX uq_pid_name ON `version` (`pid`, `name`);
update maintainer set utime=ctime;
update `version` set mtime=ctime;
```

请执行以上sql语句升级数据库

## NFS 文件迁移

之前我们存放的路径在

```bash
$ node
$ process.env.HOME # /usr/local
```

那么我们将里面的文件 `/usr/local/packages/` 移动到当前项目下即可。

# License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, yunjie (Evio) shen
