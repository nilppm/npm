import { NPMContext } from '../index';
import { Component, NELTS_CONFIGS } from '@nelts/nelts';
import * as request from 'request';
import { CacheableInterface } from '@nelts/orm';
import * as path from 'path';
import * as crypto from 'crypto';
import * as uuid from 'uuid/v4';
import * as fse from 'fs-extra';
import * as fs from 'fs';

export default class PackageService extends Component.Service<NPMContext> {
  private configs: NELTS_CONFIGS;
  constructor(ctx: NPMContext) {
    super(ctx);
    this.configs = ctx.app.configs;
  }

  async unPublish(filepath: string, rev: string) {
    const MaintainerService = new this.service.MaintainerService(this.ctx);
    const VersionService = new this.service.VersionService(this.ctx);
    const TagService = new this.service.TagService(this.ctx);
    const result = await VersionService.getSingleVersionByRev(rev, 'id', 'pid', 'name', 'package', 'ctime', 'tarball');
    if (!result) throw new Error('cannot find the rev of ' + rev);
    const pack = await this.getSinglePackageById(result.pid, 'id', 'pathname');
    if (!pack) throw new Error('cannot find the package of id: ' + result.pid);
    if (filepath.endsWith('.tgz')) {
      if (pack.pathname + '-' + result.name + '.tgz' !== filepath) throw new Error('invaild package receiver.');
    }
    
    const maintainers = await MaintainerService.getMaintainersByPid(pack.id);
    if (!MaintainerService.checkMaintainerAllow(this.ctx.account, maintainers)) throw new Error('you cannot unpublish this package');
    await VersionService.deleteVersion(result.id);
    const count = await VersionService.getCountOfPid(pack.id);
    if (count === 0) {
      await this.clearPackage(pack.id);
      await this.removePackageCache(pack.id, pack.pathname);
    } else {
      const tags = await TagService.getVidAndNameByPid(pack.id);
      let pool: string[] = [];
      for (let i = 0; i < tags.length; i++) {
        if (tags[i].vid === result.id) {
          pool.push(tags[i].name);
        }
      }
      if (pool.length) {
        const version = await VersionService.findLatestVersion(pack.id, new Date(result.ctime));
        if (version) {
          await TagService.updateVidOnNamesByPid(pack.id, version.id, pool);
        }
      }
      await this.updateModifiedTime(pack.id);
      await this.updatePackageCache(pack.id);
    }
    const dfile = path.resolve(this.configs.nfs, result.tarball);
    if (fs.existsSync(dfile)) fs.unlinkSync(dfile);
    return JSON.parse(result.package);
  }

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

  async removeAllByPid(pid: number) {
    return await this.ctx.dbo.package.destroy({
      where: { id: pid }
    });
  }

  async removePackageCache(pid: number, pathname: string) {
    const TagServer = new this.service.TagService(this.ctx);
    const VersionService = new this.service.VersionService(this.ctx);
    const MaintainerService = new this.service.MaintainerService(this.ctx);

    await MaintainerService.getMaintainersCache(pid).delete({ pid });
    await TagServer.getTagsCache(pid).delete({ pid });
    await VersionService.getVersionCache(pid).delete({ pid });
    await this.ctx.redis.delete(':package:' + pathname);
  }

  // @Cacheable('/package/:pathname/:version')
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

  async getRemotePackageInformation(pathname: string, version?: string) {
    const fetchPackageRegistriesOrder = this.configs.fetchPackageRegistriesOrder;
    for (let i = 0; i < fetchPackageRegistriesOrder.length; i++) {
      const text = await this.getUri(this.configs[fetchPackageRegistriesOrder[i]], pathname, version);
      try{
        const result = JSON.parse(text);
        if (!result.error) return result;
      }catch(e){}
    }
    throw new Error('not found');
  }

  async getLocalPackageByPid(pid: number, ctime: Date, mtime: Date, version?: string) {
    const TagServer = new this.service.TagService(this.ctx);
    const VersionService = new this.service.VersionService(this.ctx);
    const MaintainerService = new this.service.MaintainerService(this.ctx);
    const UserService = new this.service.UserService(this.ctx);
    const [maintainers, tags, versions] = await Promise.all([
      MaintainerService.getMaintainersCache(pid).get({ pid }),
      TagServer.getTagsCache(pid).get({ pid }),
      VersionService.getVersionCache(pid).get({ pid })
    ]);
    if (
      !maintainers || !maintainers.length || 
      !tags || !tags.latest ||
      !versions || !Object.keys(versions).length
    ) throw new Error('invaild cache data with package');

    let chunk: any;
    const distTags: {[name: string]: string} = {};
    const chunkVersions: {[version: string]: any} = {};
    const times: {[version: string]: string} = {};
    for (const i in tags) distTags[i] = versions[tags[i]].version;
    if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
      if (!distTags[version]) throw new Error('cannot find tag in dist-tags:' + version);
      version = distTags[version];
    }
    if (!version) {
      if (!versions[tags.latest]) throw new Error('cannot find the latest version');
      chunk = versions[tags.latest];
    } else {
      for (const i in versions) {
        if (versions[i].version === version) {
          
          chunk = versions[i];
          break;
        }
      }
    }
    if (!chunk) throw new Error('invaild version data in cache');
    chunk = JSON.parse(JSON.stringify(chunk));
    chunk.maintainers = (await Promise.all(maintainers.map(
      (maintainer: string) => UserService.userCache(maintainer).get({ account: maintainer })))
    ).map((user: {account: string, email: string}) => {
      return {
        name: user.account,
        email: user.email,
      }
    });
    chunk['dist-tags'] = distTags;
    for (const i in versions) {
      times[versions[i].version] = versions[i]._created;
      chunkVersions[versions[i].version] = versions[i];
    }
    chunk.versions = chunkVersions;
    chunk.time = times;
    chunk.time.created = ctime;
    chunk.time.modified = mtime;
    return chunk;
  }

  async getPackageInfo(pkg: { pathname: string, version?: string }) {
    const pck = await this.ctx.redis.get(':package:' + pkg.pathname);
    if (pck) {
      return await this.getLocalPackageByPid(pck.id, new Date(pck.ctime), new Date(pck.mtime), pkg.version);
    }

    const pack = await this.getSinglePackageByPathname(pkg.pathname, 'ctime', 'mtime');
    if (pack) {
      await this.updatePackageCache(pack.id);
      return await this.getLocalPackageByPid(pack.id, pack.ctime, pack.mtime, pkg.version);
    }
    
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
   * @param attributes {...ModelAttributeColumnOptions[]} 字段数组
   * @returns Promise<Sequelize.Model>
   */
  async getSinglePackageByPathname(pathname: string, ...attributes: string[]) {
    const res = await this.ctx.dbo.package.findAll({
      attributes: attributes.length > 0 ? attributes : ['id'],
      where: { pathname }
    });
    if (!res.length) return;
    return res[0];
  }

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
   * @returns Promise<Sequelize.Model>
   */
  async createNewPackage(scope: string, name: string, pathname: string) {
    return await this.ctx.dbo.package.create({
      scope, name, pathname,
    });
  }

  async updatPackage(pkg: any) {
    const pathname = pkg.name;
    const versions = pkg.versions;
    const pack = await this.getSinglePackageByPathname(pathname);
    const VersionService = new this.service.VersionService(this.ctx);
    const MaintainerService = new this.service.MaintainerService(this.ctx);
    if (!pack) throw new Error('cannot find the package of ' + pathname);
    const maintainers = await MaintainerService.getMaintainersByPid(pack.id);
    if (!MaintainerService.checkMaintainerAllow(this.ctx.account, maintainers)) throw new Error('you cannot update version metadata ' + pkg.name);
    const pid = pack.id;
    let updated = 0;
    for (const i in versions) {
      const version = versions[i];
      updated += await VersionService.update(pid, version);
    }
    if (updated) {
      await this.updateModifiedTime(pid);
      await this.updatePackageCache(pid);
    }
  }

  /**
   * 发布一个新模块
   * @param account {string} 账号
   * @param pkg {object} 内容
   * @returns void
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

    if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('version is not a vaild version rule: ' + version);

    const tarballPath = path.resolve(this.configs.nfs, filename);
    if (!MaintainerService.checkMaintainerAllow(account, pkg.maintainers)) {
      throw new Error('You cannot publish this package or tell admins to add right for you');
    }

    if (!Object.keys(distTags).length) {
      throw new Error('invalid: dist-tags should not be empty.');
    }

    const { scope, alias } = this.splitPackagePathname(name);

    const cache: CacheableInterface = await UserService.userCache(account);
    const user = await cache.get({ account });
    if (user.scopes.indexOf(scope) === -1) {
      throw new Error('forbidden: cannot publish package using ' + scope);
    }

    const attachment = pkg._attachments[filename];
    const tarballBuffer = Buffer.from(attachment.data, 'base64');
    if (tarballBuffer.length !== attachment.length) {
      throw new Error(`size_wrong: Attachment size ${attachment.length} not match download size ${tarballBuffer.length}`);
    }

    const shasum = this.createShasumCode(tarballBuffer);

    if (pkg.versions[version].dist) {
      pkg.versions[version].dist.tarball = this.configs.registryHost + '/download/' + filename;
      if (pkg.versions[version].dist.shasum !== shasum) {
        throw new Error(`shasum_wrong: Attachment shasum ${shasum} not match download size ${pkg.versions[version].dist.shasum}`);
      }
    }

    let packageId, firstTime = false;
    const packages = await this.getSinglePackageByPathname(name);
    if (!packages) {
      const packageModel = await this.createNewPackage(scope, alias, name);
      packageId = packageModel.id;
      firstTime = true;
    } else {
      packageId = packages.id;
    }

    const sysMaintainers = await MaintainerService.getMaintainersByPid(packageId);

    if (!firstTime) {
      if (!MaintainerService.checkMaintainerAllow(account, sysMaintainers)) {
        throw new Error('you have no right to publish package with ' + name);
      }
    } else {
      await MaintainerService.createNewMaintainer(account, packageId);
    }

    const _versions: { name: string }[] = await VersionService.getVersionsByPid(packageId);
    if (!VersionService.checkVersionAllow(version, _versions.map(ver => ver.name))) {
      throw new Error('forbidden: cannot publish pre-existing version: ' + version);
    }
    
    if (pkg.versions[version].dist) {
      pkg.versions[version].dist.size = attachment.length;
    }

    const versionModel = await VersionService.createNewVersion({
      pid: packageId,
      name: version,
      description: pkg.description,
      account,
      shasum,
      tarball: filename,
      size: attachment.length,
      package: JSON.stringify(pkg.versions[version]),
      rev: uuid()
    });

    const vid = versionModel.id;

    const tags = [];
    for (var t in distTags) tags.push([t, vid]);
    if (!distTags.latest) {
      const latest = await TagServer.getChunksByPidAndName(packageId, 'latest');
      if (!latest.length) {
        tags.push(['latest', vid]);
      }
    }

    for (let i = 0; i < tags.length; i++) {
      await TagServer.createNewTag(packageId, tags[i][0], tags[i][1]);
    }

    await fse.ensureDir(path.dirname(tarballPath));
    fs.writeFileSync(tarballPath, tarballBuffer);
    await this.updateModifiedTime(packageId);
    await this.updatePackageCache(packageId);
  }

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