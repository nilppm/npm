import { Component, Context } from '@nelts/nelts';
import { getSequelizeFieldValues } from '@nelts/orm';

interface VersionCompareTree {
  items?: {
    [id:string]: VersionCompareTree
  },
  max: number,
}

export default class VersionService extends Component.Service {
  constructor(ctx: Context) {
    super(ctx);
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

  async getVersionsByPid(pid: number) {
    const versions = <{ name: string }[]>getSequelizeFieldValues(await this.ctx.sequelize.cpm.version.findAll({
      attributes: ['name'],
      where: { pid }
    }));
    return versions.map(ver => ver.name);
  }

  async createNewVersion(options: object) {
    return await this.ctx.sequelize.cpm.version.create(options);
  }
}