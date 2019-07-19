import { NPMContext, NPMWorkerPlugin } from '../index';
import { Component, NELTS_CONFIGS } from '@nelts/nelts';
import * as request from 'request';
import { CacheableInterface } from '@nelts/orm';
import * as path from 'path';
import * as crypto from 'crypto';
import * as uuid from 'uuid/v4';
import * as fse from 'fs-extra';
import * as fs from 'fs';
import { Op }  from 'sequelize';

export default class PackageService extends Component.Service<NPMWorkerPlugin, NPMContext> {
  private configs: NELTS_CONFIGS;
  constructor(ctx: NPMContext) {
    super(ctx);
    this.configs = ctx.app.configs;
  }

  async searchFromDBO(keyword: string, size?: number) {
    const WebService = new this.service.WebService(this.ctx);
    const result = await this.ctx.dbo.package.findAndCountAll({
      attributes: ['pathname'],
      where: {
        name: {
          [Op.like]: '%' + keyword + '%'
        }
      },
      limit: 20,
      offset: size
    });
    const total = result.count;
    const names = result.rows.map(x => {
      return this.getPackageInfo({ pathname: x.pathname }).then(data => WebService.fixUser(data).then(() => {
        return {
          name: data.name,
          description: data.description,
          maintainers: data.maintainers,
          version: data.version,
          _created: data._created
        }})
      )
    });
    const objects = await Promise.all(names);
    return { objects, total, time: new Date() }
  }

  async searchFromNpm(keyword: string, size?: number) {
    if (!keyword) throw new Error('search param need a string value');
    if (!size) size = 0;
    const WebService = new this.service.WebService(this.ctx);
    return await new Promise((resolve, reject) => {
      let url = `http://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(keyword)}&from=${size}`;
      request.get(url, (err: Error, response: request.Response, body: string) => {
        if (err) return reject(err);
        if (response.statusCode >= 300 || response.statusCode < 200) return reject(new Error(response.statusMessage));
        const data = JSON.parse(body);
        if (data.error) return reject(new Error(data.error));
        const objects = data.objects.map((x: any) => {
          const pkg = x.package;
          WebService.fixRemoteMaintainers(pkg);
          return {
            name: pkg.name,
            description: pkg.description,
            maintainers: pkg.maintainers,
            version: pkg.version,
            _created: pkg.date
          };
        });
        resolve({
          objects,
          total: data.total,
          time: data.time
        });
      });
    })
  }

  /**
   * 通过命令行删除一个包的信息
   * @param filepath {string} 包名或者包地址
   * @param rev {string} 版本唯一标识码
   */
  async unPublish(filepath: string, rev: string) {
    const MaintainerService = new this.service.MaintainerService(this.ctx);
    const VersionService = new this.service.VersionService(this.ctx);
    const TagService = new this.service.TagService(this.ctx);

    // 通过版本唯一标识码获取版本信息
    const result = await VersionService.getSingleVersionByRev(rev, 'id', 'pid', 'name', 'package', 'ctime', 'tarball');
    if (!result) throw new Error('cannot find the rev of ' + rev);

    // 通过版本信息中的pid获取包信息
    const pack = await this.getSinglePackageById(result.pid, 'id', 'pathname');
    if (!pack) throw new Error('cannot find the package of id: ' + result.pid);

    if (filepath.endsWith('.tgz')) {
      // 如果是包地址，检测包地址与数据库中数据的合法性
      if (pack.pathname + '-' + result.name + '.tgz' !== filepath) throw new Error('invaild package receiver.');
    }
    
    // 检测宕看用户是否具有maintainer权限
    const maintainers = await MaintainerService.getMaintainersByPid(pack.id);
    if (!MaintainerService.checkMaintainerAllow(this.ctx.account, maintainers)) throw new Error('you cannot unpublish this package');

    // 删除数据库版本信息
    await VersionService.deleteVersion(result.id);

    // 检测删除后剩余版本数量
    const count = await VersionService.getCountOfPid(pack.id);
    if (count === 0) {
      // 如果数量为0
      // 将清空所有包相关的数据库数据
      // 同时删除包所有相关的缓存
      await this.clearPackage(pack.id);
      await this.removePackageCache(pack.id, pack.pathname);
    } else {
      // 查询档案删除版本相关的tags
      const tags = await TagService.getVidAndNameByPid(pack.id);
      let pool: string[] = [];
      
      for (let i = 0; i < tags.length; i++) {
        if (tags[i].vid === result.id) {
          pool.push(tags[i].name);
        }
      }

      if (pool.length) {
        // 如果匹配到有相关的dist-tags被修正
        // 那么，通过这个版本创建时间获取之前最新的一个版本
        // 修改相关的dist-tags指向
        const version = await VersionService.findLatestVersion(pack.id, new Date(result.ctime));
        if (version) {
          await TagService.updateVidOnNamesByPid(pack.id, version.id, pool);
        }
      }
      // 更新修改时间和缓存
      await this.updateModifiedTime(pack.id);
      await this.updatePackageCache(pack.id);
    }

    // 物理删除磁盘上对应的包
    const dfile = path.resolve(this.configs.nfs, result.tarball);
    if (fs.existsSync(dfile)) fs.unlinkSync(dfile);

    return JSON.parse(result.package);
  }

  /**
   * 统一清楚包相关的所有数据库数据
   * @param pid {number} 包ID
   */
  async clearPackage(pid: number) {
    const MaintainerService = new this.service.MaintainerService(this.ctx);
    const TagService = new this.service.TagService(this.ctx);
    const VersionService = new this.service.VersionService(this.ctx);
    await Promise.all([
      MaintainerService.removeAllByPid(pid),
      TagService.removeAllByPid(pid),
      VersionService.removeAllByPid(pid),
      this.removeAllByPid(pid)
    ]);
  }

  /**
   * 删除包的数据库数据
   * @param pid {number} 包ID
   */
  async removeAllByPid(pid: number) {
    return await this.ctx.dbo.package.destroy({
      where: { id: pid }
    });
  }

  /**
   * 删除包缓存数据
   * @param pid {number} 包ID
   * @param pathname {string} 包名
   */
  async removePackageCache(pid: number, pathname: string) {
    const TagServer = new this.service.TagService(this.ctx);
    const VersionService = new this.service.VersionService(this.ctx);
    const MaintainerService = new this.service.MaintainerService(this.ctx);

    await MaintainerService.getMaintainersCache(pid).delete({ pid });
    await TagServer.getTagsCache(pid).delete({ pid });
    await VersionService.getVersionCache(pid).delete({ pid });
    await this.ctx.redis.delete(':package:' + pathname);
  }

  /**
   * 更新包的缓存信息
   * @param pid {number} 包ID
   */
  async updatePackageCache(pid: number) {
    const TagServer = new this.service.TagService(this.ctx);
    const VersionService = new this.service.VersionService(this.ctx);
    const MaintainerService = new this.service.MaintainerService(this.ctx);

    await MaintainerService.getMaintainersCache(pid).set({ pid });
    await TagServer.getTagsCache(pid).set({ pid });
    await VersionService.getVersionCache(pid).set({ pid });

    const pack = await this.ctx.dbo.package.findAll({
      attributes: ['pathname', 'ctime', 'mtime'],
      where: {
        id: pid
      }
    });

    const pathname = pack[0].pathname;
    const ctime = pack[0].ctime;
    const mtime = pack[0].mtime;
    await this.ctx.redis.set(':package:' + pathname, {
      id: pid,
      ctime, mtime
    });
  }

  /**
   * 单个获取远程包数据
   * @param url {string} url地址
   * @param name {string} 包名
   * @param version {string} 版本
   */
  async getUri(url: string, name: string, version: string): Promise<string> {
    return await new Promise((resolve, reject) => {
      url += '/' + name;
      if (version) url += '/' + version;
      request.get(url, (err: Error, response: request.Response, body: string) => {
        if (err) return reject(err);
        if (response.statusCode >= 300 || response.statusCode < 200) return reject(new Error(response.statusMessage));
        resolve(body);
      });
    })
  }

  /**
   * 远程获取公有包数据
   * @param pathname {string} 包名
   * @param version {string} 版本
   */
  async getRemotePackageInformation(pathname: string, version?: string) {
    const fetchPackageRegistriesOrder = this.configs.fetchPackageRegistriesOrder;
    for (let i = 0; i < fetchPackageRegistriesOrder.length; i++) {
      const text = await this.getUri(this.configs[fetchPackageRegistriesOrder[i]], pathname, version);
      try{
        const result = JSON.parse(text);
        if (!result.error) {
          if (!result.version) {
            if (!version) {
              result.version = result['dist-tags'].latest;
            } else {
              if (/\d+\.\d+\.\d+/.test(version)) {
                result.version = version;
              } else {
                result.version = result['dist-tags'][version];
              }
            }
          }
          return result;
        }
      }catch(e){}
    }
    throw new Error('not found');
  }

  /**
   * 获取私有包
   * @param pid {number} 包ID
   * @param ctime {Date} 创建时间
   * @param mtime {Date} 更新时间
   * @param version {string} 版本
   */
  async getLocalPackageByPid(pid: number, ctime: Date, mtime: Date, version?: string) {
    const TagServer = new this.service.TagService(this.ctx);
    const VersionService = new this.service.VersionService(this.ctx);
    const MaintainerService = new this.service.MaintainerService(this.ctx);
    const UserService = new this.service.UserService(this.ctx);
    // 获取相关缓存数据
    const [maintainers, tags, versions] = await Promise.all([
      MaintainerService.getMaintainersCache(pid).get({ pid }),
      TagServer.getTagsCache(pid).get({ pid }),
      VersionService.getVersionCache(pid).get({ pid })
    ]);

    // 检测缓存数据是否合法
    if (
      !maintainers || !maintainers.length || 
      !tags || !tags.latest ||
      !versions || !Object.keys(versions).length
    ) throw new Error('invaild cache data with package');

    let chunk: any;
    const distTags: {[name: string]: string} = {};
    const chunkVersions: {[version: string]: any} = {};
    const times: {[version: string]: string} = {};

    // 将缓存的dist-tags转换为真正版本
    for (const i in tags) distTags[i] = versions[tags[i]].version;

    if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
      // 检测版本别名是否存在于dist-tags上
      if (!distTags[version]) throw new Error('cannot find tag in dist-tags:' + version);
      version = distTags[version];
    }

    let _currentVersion: string;
    if (!version) {
      // 如果没有latest版本指向
      // 我们认为是不合规的版本包
      if (!versions[tags.latest]) throw new Error('cannot find the latest version');
      chunk = versions[tags.latest];
      _currentVersion = tags.latest;
    } else {
      for (const i in versions) {
        if (versions[i].version === version) {
          // 取得当前指定的版本chunk
          chunk = versions[i];
          _currentVersion = version;
          break;
        }
      }
    }

    if (!chunk) throw new Error('invaild version data in cache');

    // 复制版本chunk，防止指针指向
    chunk = JSON.parse(JSON.stringify(chunk));
    if (!chunk.version) chunk.version = _currentVersion;

    // chunk中插入maintainers数据
    chunk.maintainers = (await Promise.all(maintainers.map(
      (maintainer: string) => UserService.userCache(maintainer).get({ account: maintainer })))
    ).map((user: {account: string, email: string}) => {
      return {
        name: user.account,
        email: user.email,
      }
    });

    // chunk中插入dist-tags数据
    chunk['dist-tags'] = distTags;

    for (const i in versions) {
      // chunk中time字段需要的数据
      times[versions[i].version] = versions[i]._created;
      // chunk中versions字段需要的数据
      chunkVersions[versions[i].version] = versions[i];
      if (chunkVersions[versions[i].version].readme) delete chunkVersions[versions[i].version].readme;
    }

    chunk._nilppm = true; // 制定当前包来源nilppm私有管理系统
    chunk.versions = chunkVersions;
    chunk.time = times;
    chunk.time.created = ctime;
    chunk.time.modified = mtime;
    if (chunk.main) delete chunk.main;
    if (chunk._nodeVersion) delete chunk._nodeVersion;
    if (chunk._npmUser) delete chunk._npmUser;
    if (chunk._npmVersion) delete chunk._npmVersion;
    return chunk;
  }

  /**
   * 通用获取包数据的方法
   * @param pkg { pathname: string, version?: string } 包信息
   */
  async getPackageInfo(pkg: { pathname: string, version?: string }) {
    const pck = await this.ctx.redis.get(':package:' + pkg.pathname);
    if (pck) {
      // 获取私有包
      return await this.getLocalPackageByPid(pck.id, new Date(pck.ctime), new Date(pck.mtime), pkg.version);
    }

    const sp = pkg.pathname.split('/');
    if (sp.length > 2) throw new Error('invaild package name');
    if (sp.length === 2) {
      const scope = sp[0];
      if (this.configs.scopes.indexOf(scope) > -1) {
        const pack = await this.getSinglePackageByPathname(pkg.pathname, 'id', 'ctime', 'mtime');
        if (pack) {
          // 如果数据库存在这个包
          // 而缓存不存在
          // 那么重建缓存 返回包数据
          await this.updatePackageCache(pack.id);
          return await this.getLocalPackageByPid(pack.id, pack.ctime, pack.mtime, pkg.version);
        }
      }
    }

    // 获取公有包数据
    return await this.getRemotePackageInformation(pkg.pathname, pkg.version);
  }

  /**
   * 数据源SHA1加密
   * @param tarballBuffer {Buffer} 数据源Buffer
   * @returns string
   */
  createShasumCode(tarballBuffer: Buffer) {
    const shasum = crypto.createHash('sha1');
    shasum.update(tarballBuffer);
    return shasum.digest('hex');
  }

  /**
   * 分割命名空间
   * @param pathname 命名空间
   * @returns <{scope: string, alias: string}>
   */
  splitPackagePathname(pathname: string) {
    const sp = pathname.split('/');
    return {
      scope: sp[0],
      alias: sp[1],
    }
  }

  /**
   * 通过`pathname`查询到对应的模块
   * @param pathname {string} 命名空间
   * @param attributes {...string[]} 字段数组
   */
  async getSinglePackageByPathname(pathname: string, ...attributes: string[]) {
    const res = await this.ctx.dbo.package.findAll({
      attributes: attributes.length > 0 ? attributes : ['id'],
      where: { pathname }
    });
    if (!res.length) return;
    return res[0];
  }

  /**
   * 通过pid获取包数据
   * @param id {number} 包ID
   * @param attributes {...string[]} 字段数组
   */
  async getSinglePackageById(id: number, ...attributes: string[]) {
    const res = await this.ctx.dbo.package.findAll({
      attributes: attributes.length > 0 ? attributes : ['id'],
      where: { id }
    });
    if (!res.length) return;
    return res[0];
  }

  /**
   * 创建一个新的模块数据
   * @param scope {string} scope域
   * @param name {string} 模块名
   * @param pathname {string} 命名空间
   */
  async createNewPackage(scope: string, name: string, pathname: string) {
    return await this.ctx.dbo.package.create({
      scope, name, pathname,
    });
  }

  /**
   * 更新包源数据信息
   * @param pkg {json} 包内容
   */
  async updatPackage(pkg: any) {
    const pathname = pkg.name;
    const versions = pkg.versions;
    const pack = await this.getSinglePackageByPathname(pathname);
    const VersionService = new this.service.VersionService(this.ctx);
    const MaintainerService = new this.service.MaintainerService(this.ctx);
    if (!pack) throw new Error('cannot find the package of ' + pathname);
    const maintainers = await MaintainerService.getMaintainersByPid(pack.id);

    // 检测当前用户是否具有更新权限
    if (!MaintainerService.checkMaintainerAllow(this.ctx.account, maintainers)) throw new Error('you cannot update version metadata ' + pkg.name);

    const pid = pack.id;
    // update机制是如果数据库更新
    // updated++
    let updated = 0;
    for (const i in versions) {
      const version = versions[i];
      updated += await VersionService.update(pid, version);
    }

    // 只有真正更新才更新缓存
    if (updated) {
      await this.updateModifiedTime(pid);
      await this.updatePackageCache(pid);
    }
  }

  /**
   * 发布一个新模块
   * @param account {string} 账号
   * @param pkg {object} 内容
   */
  async publish(account: string, pkg: any) {
    const name = pkg.name;
    const filename = Object.keys(pkg._attachments)[0];
    const version = Object.keys(pkg.versions)[0];
    const distTags = pkg['dist-tags'] || {};

    // 启动辅助服务
    const UserService = new this.service.UserService(this.ctx);
    const VersionService = new this.service.VersionService(this.ctx);
    const MaintainerService = new this.service.MaintainerService(this.ctx);
    const TagServer = new this.service.TagService(this.ctx);

    // 检测版本是否合规
    if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('version is not a vaild version rule: ' + version);

    // 检测包自身的 maintainers 权限
    const tarballPath = path.resolve(this.configs.nfs, filename);
    if (!MaintainerService.checkMaintainerAllow(account, pkg.maintainers)) {
      throw new Error('You cannot publish this package or tell admins to add right for you');
    }

    // 如果没有 dist-tags 那么就认为不是一个完整的包
    if (!Object.keys(distTags).length) {
      throw new Error('invalid: dist-tags should not be empty.');
    }

    const { scope, alias } = this.splitPackagePathname(name);

    const cache: CacheableInterface = await UserService.userCache(account);
    const user = await cache.get({ account });

    // 检测私有包的 scope 域是否是系统合法可提交的
    if (user.scopes.indexOf(scope) === -1) {
      throw new Error('forbidden: cannot publish package using ' + scope);
    }

    const attachment = pkg._attachments[filename];

    // 将上传的包的base64数据转换成Buffer流
    // 以便使用fs存储到磁盘上
    const tarballBuffer = Buffer.from(attachment.data, 'base64');
    if (tarballBuffer.length !== attachment.length) {
      throw new Error(`size_wrong: Attachment size ${attachment.length} not match download size ${tarballBuffer.length}`);
    }

    // 创建 tarball 的 Buffer 流的 shasum 编码
    const shasum = this.createShasumCode(tarballBuffer);

    if (pkg.versions[version].dist) {
      pkg.versions[version].dist.tarball = this.configs.registryHost + '/download/' + filename;
      // 检测shasum编码是否合法
      if (pkg.versions[version].dist.shasum !== shasum) {
        throw new Error(`shasum_wrong: Attachment shasum ${shasum} not match download size ${pkg.versions[version].dist.shasum}`);
      }
    }

    let packageId, firstTime = false;
    const packages = await this.getSinglePackageByPathname(name);
    if (!packages) {
      // 如果包没有发布过
      // 新建一个包数据
      const packageModel = await this.createNewPackage(scope, alias, name);
      packageId = packageModel.id;
      firstTime = true;
    } else {
      packageId = packages.id;
    }

    // 获取系统的 maintainers 权限列表
    const sysMaintainers = await MaintainerService.getMaintainersByPid(packageId);

    if (!firstTime) {
      // 匹配当前用户在系统可提交的权限
      if (!MaintainerService.checkMaintainerAllow(account, sysMaintainers)) {
        throw new Error('you have no right to publish package with ' + name);
      }
    } else {
      // 如果是第一次提交
      // 直接创建当前用户的maintainer权限
      await MaintainerService.createNewMaintainer(account, packageId);
    }

    const _versions: { name: string }[] = await VersionService.getVersionsByPid(packageId);

    // 检测版本提交的合法性
    // 如果我们存在 ['1.5.3', '1.5.5', '1.6.4', '2.1.5']这些版本
    // 那么我们可以提交的版本有 ['1.5.6', '1.6.5', '1.7.0', '2.1.6', '2.0.9']等
    // 不能提交的版本有 ['1.5.4', '1.6.4', '2.1.5', '2.0.8'] 等
    if (!VersionService.checkVersionAllow(version, _versions.map(ver => ver.name))) {
      throw new Error('forbidden: cannot publish pre-existing version: ' + version);
    }
    
    if (pkg.versions[version].dist) {
      pkg.versions[version].dist.size = attachment.length;
    }

    const _package = pkg.versions[version];
    _package.author = account;
    if (_package.scripts) delete _package.scripts;
    if (_package.readmeFilename) delete _package.readmeFilename;

    // 创建一个新的版本
    const versionModel = await VersionService.createNewVersion({
      pid: packageId,
      name: version,
      description: pkg.description,
      account,
      shasum,
      tarball: filename,
      size: attachment.length,
      package: JSON.stringify(_package),
      rev: uuid()
    });

    const vid = versionModel.id;
    const tags = [];

    // 生成完整的tags数组
    for (var t in distTags) tags.push([t, vid]);
    if (!distTags.latest) {
      const latest = await TagServer.getChunksByPidAndName(packageId, 'latest');
      if (!latest.length) {
        tags.push(['latest', vid]);
      }
    }

    for (let i = 0; i < tags.length; i++) {
      // 逐个创建
      // createNewTag方法将自动识别是否已经创建
      await TagServer.createNewTag(packageId, tags[i][0], tags[i][1]);
    }

    // 保证文件夹的存在
    await fse.ensureDir(path.dirname(tarballPath));

    // 写入磁盘
    fs.writeFileSync(tarballPath, tarballBuffer);

    // 更新最后修改时间
    await this.updateModifiedTime(packageId);

    // 更新包数据相关缓存
    await this.updatePackageCache(packageId);
  }

  /**
   * 修改包最后更新时间
   * @param pid {number} 包ID
   */
  async updateModifiedTime(pid: number) {
    return await this.ctx.dbo.package.update({
      mtime: new Date(),
    }, {
      where: {
        pid
      }
    });
  }
}