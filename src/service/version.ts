import { NPMContext, NPMWorkerPlugin } from '../index';
import { Component } from '@nelts/nelts';
import { Cacheable } from '@nelts/orm';
import { Op } from 'sequelize';

interface VersionCompareTree {
  items?: {
    [id:string]: VersionCompareTree
  },
  max: number,
}

export default class VersionService extends Component.Service<NPMWorkerPlugin, NPMContext> {
  constructor(ctx: NPMContext) {
    super(ctx);
  }

  async removeAllByPid(pid: number) {
    return await this.ctx.dbo.version.destroy({
      where: { pid }
    });
  }

  async findLatestVersion(pid: number, ctime: Date) {
    return await this.ctx.dbo.version.findOne({
      attributes: ['id'],
      where: {
        pid,
        ctime: {
          [Op.lt]: ctime
        }
      },
      order: [
        ['ctime', 'DESC']
      ]
    });
  }

  @Cacheable('/package/:pid(\\d+)/versions')
  async getVersionCache(pid: number) {
    const result = await this.getVersionsByPid(pid, 'id', 'name', 'ctime', 'package', 'rev');
    const res: {[name: string]: any} = {};
    result.forEach(ret => {
      const string = ret.package.indexOf('%7B%22') === 0 ? decodeURIComponent(ret.package) : ret.package;
      const chunk = JSON.parse(string);
      if (ret.name !== chunk.version) return;
      chunk._created = ret.ctime;
      chunk._rev = ret.rev;
      res[ret.id] = chunk;
    });
    return res;
  }

  checkVersionAllow(version: string, versions: string[]) {
    const root: VersionCompareTree = {
      items: {}, // 1
      max: 0,
    };
    versions.forEach(ver => {
      const sp = ver.split('.').map(Number);
      const MAJOR = sp[0];
      const MINOR = sp[1];
      const PATCH = sp[2];

      if (!root.items[MAJOR]) root.items[MAJOR] = {
        items: {},// 2
        max: 0,
      }
      if (MAJOR > root.max) root.max = MAJOR;
      if (!root.items[MAJOR].items[MINOR]) root.items[MAJOR].items[MINOR] = {
        items: {},// 3
        max: 0,
      }
      if (MINOR > root.items[MAJOR].max) root.items[MAJOR].max = MINOR;
      if (PATCH > root.items[MAJOR].items[MINOR].max) root.items[MAJOR].items[MINOR].max = PATCH;
    });
    const sp = version.split('.').map(Number);
    const MAJOR = sp[0];
    const MINOR = sp[1];
    const PATCH = sp[2];

    if (root.items[MAJOR]) {
      const a = root.items[MAJOR];
      if (a.items[MINOR]) {
        const b = a.items[MINOR];
        if (b.max < PATCH) return true;
      } else {
        if (a.max < MINOR) return true;
      }
    } else {
      if (root.max < MAJOR) return true;
    }
  }

  async getVersionsByPid(pid: number, ...args: string[]) {
    return await this.ctx.dbo.version.findAll({
      attributes: args.length > 0 ? args : ['name'],
      where: { pid }
    });
  }

  async getVersionByPidAndName(pid: number, name: string, ...args: string[]) {
    return await this.ctx.dbo.version.findOne({
      attributes: args.length > 0 ? args : ['id'],
      where: { pid, name }
    });
  }

  async createNewVersion(options: object) {
    return await this.ctx.dbo.version.create(options);
  }

  async getSingleVersionByRev(rev: string, ...attributes: string[]) {
    const res = await this.ctx.dbo.version.findAll({
      attributes: attributes.length > 0 ? attributes : ['id'],
      where: { rev }
    });
    if (!res.length) return;
    return res[0];
  }

  async updateVersion(id: number, data: object) {
    return await this.ctx.dbo.version.update(data, {
      where: {
        id
      }
    });
  }

  async update(pid: number, version: any) {
    const one = await this.ctx.dbo.version.findOne({
      attributes: ['id', 'package'],
      where: { 
        pid, 
        name: version.version
      }
    });
    if (!one) return 0;
    const pkg = JSON.parse(one.package);
    const condition = pkg.deprecated !== version.deprecated;
    if (condition) {
      await this.ctx.dbo.version.update({
        package: JSON.stringify(version),
        mtime: new Date()
      }, {
        where: {
          id: one.id
        }
      });
      return 1;
    }
    return 0;
  }

  async deleteVersion(vid: number) {
    return await this.ctx.dbo.version.destroy({
      where: { id: vid }
    });
  }

  async getCountOfPid(pid: number) {
    return await this.ctx.dbo.version.count({
      where: {
        pid
      }
    });
  }
}