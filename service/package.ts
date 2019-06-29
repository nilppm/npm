import { Component, Context, NELTS_CONFIGS } from '@nelts/nelts';
import * as request from 'request';
import { Cacheable, CacheableInterface, getSequelizeFieldValues } from '@nelts/orm';
import * as path from 'path';
import * as crypto from 'crypto';
import * as uuid from 'uuid/v4';
import * as fse from 'fs-extra';
import * as fs from 'fs';
import { ModelAttributeColumnOptions } from 'sequelize';

export default class PackageService extends Component.Service {
  private configs: NELTS_CONFIGS;
  constructor(ctx: Context) {
    super(ctx);
    this.configs = ctx.app.configs;
  }

  @Cacheable('/package/:pathname')
  async PackageCache(pathname: string): Promise<any> {
    return {a:1};
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

  async getPackageInfo(pkg: { pathname: string, version?: string }) {
    // const cache: CacheableInterface = await this.PackageCache(pathname);
    // const result = await cache.get({ pathname });
    // if (result) return result;
    return await this.getRemotePackageInformation(pkg.pathname, pkg.version);
  }

  async updatePackageCache(pid: number) {

  }

  /**
   * 数据源SHA1加密
   * @param tarballBuffer {Buffer} 数据源Buffer
   * @returns string
   */
  async createShasumCode(tarballBuffer: Buffer) {
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
  async getSinglePackageByPathname(pathname: string, ...attributes: ModelAttributeColumnOptions[]) {
    return await this.ctx.sequelize.cpm.package.findAll({
      attributes: attributes || ['id'],
      where: { pathname }
    });
  }

  /**
   * 创建一个新的模块数据
   * @param scope {string} scope域
   * @param name {string} 模块名
   * @param pathname {string} 命名空间
   * @returns Promise<Sequelize.Model>
   */
  async createNewPackage(scope: string, name: string, pathname: string) {
    return await this.ctx.sequelize.cpm.package.create({
      scope, name, pathname,
    });
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
    if (!packages.length) {
      const packageModel = await this.createNewPackage(scope, alias, name);
      packageId = packageModel.id;
      firstTime = true;
    } else {
      packageId = packages[0].id;
    }

    const sysMaintainers = MaintainerService.getMaintainersByPid(packageId);

    if (!firstTime) {
      if (!MaintainerService.checkMaintainerAllow(account, sysMaintainers)) {
        throw new Error('you have no right to publish package with ' + name);
      }
    } else {
      await MaintainerService.createNewMaintainer(account, packageId);
    }

    if (!VersionService.checkVersionAllow(version, await VersionService.getVersionsByPid(packageId))) {
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
      package: encodeURIComponent(JSON.stringify(pkg.versions[version])),
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
    return await this.ctx.sequelize.cpm.package.update({
      mtime: new Date(),
    }, {
      where: {
        pid
      }
    });
  }
}