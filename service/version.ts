import { NPMContext } from '../index';
import { Component } from '@nelts/nelts';
import { Cacheable } from '@nelts/orm';

interface VersionCompareTree {
  items?: {
    [id:string]: VersionCompareTree
  },
  max: number,
}

export default class VersionService extends Component.Service<NPMContext> {
  constructor(ctx: NPMContext) {
    super(ctx);
  }

  @Cacheable('/package/:pid(\\d+)/versions')
  async getVersionCache(pid: number) {
    const result = await this.getVersionsByPid(pid, 'id', 'name', 'ctime', 'package', 'rev');
    const res: {[name: string]: any} = {};
    result.forEach(ret => {
      const chunk = JSON.parse(ret.package);
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
}