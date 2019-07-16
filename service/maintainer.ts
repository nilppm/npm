import { NPMContext } from '../index';
import { Component, NELTS_CONFIGS } from '@nelts/nelts';
import { Cacheable, CacheableInterface } from '@nelts/orm';
import intersect, { intersectResult } from '../lib/intersect';

type MaintainerData = {
  name: string,
  email?: string,
  account?: string,
}

export default class MaintainerService extends Component.Service<NPMContext> {
  private configs: NELTS_CONFIGS;
  constructor(ctx: NPMContext) {
    super(ctx);
    this.configs = ctx.app.configs;
  }

  async removeAllByPid(pid: number) {
    return await this.ctx.dbo.maintainer.destroy({
      where: { pid }
    });
  }

  @Cacheable('/package/:pid(\\d+)/maintainers')
  async getMaintainersCache(pid: number): Promise<any> {
    const result = await this.getMaintainersByPid(pid);
    return result.map(res => res.account);
  }

  checkMaintainerAllow(account: string, maintainers: MaintainerData[]) {
    if (!account) throw new Error('you must login first.');
    if (this.configs.admins) {
      const admins = Array.isArray(this.configs.admins) ? this.configs.admins : [this.configs.admins];
      if (admins.indexOf(account) > -1) return true;
    }
    for (let i = 0; i < maintainers.length; i++) {
      const maintainer = maintainers[i];
      if ((maintainer.name || maintainer.account) === account) return true;
    }
  }

  async addOwner(rev: string, pathname: string, maintainers: MaintainerData[]) {
    const PackageService = new this.service.PackageService(this.ctx);
    const VersionService = new this.service.VersionService(this.ctx);
    const pack = await PackageService.getSinglePackageByPathname(pathname);
    const ver = await VersionService.getSingleVersionByRev(rev, 'id', 'package');
    if (!pack) throw new Error('cannot find package: ' + pathname);
    if (!ver) throw new Error('cannot find verion<rev> of package: ' + pathname + ': ' + rev);
    const databaseMaintainers = await this.getMaintainersByPid(pack.id);
    if (!this.checkMaintainerAllow(this.ctx.account, databaseMaintainers.map(user => {
      return {
        name: user.account,
      }
    }))) throw new Error('you have no right to use `add owner` commander');
    const oldMaintainers = databaseMaintainers.map(user => user.account);
    const newMaintainers = maintainers.map(user => user.name);
    ver.package = ver.package.indexOf('%7B%22') === 0 ? JSON.parse(decodeURIComponent(ver.package)) : JSON.parse(ver.package);
    ver.package.maintainers = maintainers;
    const diff: intersectResult = intersect(oldMaintainers, newMaintainers);
    if (diff.adds.length) await Promise.all(diff.adds.map((account: string) => this.createNewMaintainer(account, pack.id)));
    if (diff.removes.length) await Promise.all(diff.removes.map((account: string) => this.deleteMaintainer(account, pack.id)));
    const cache: CacheableInterface = await this.getMaintainersCache(pack.id);
    await cache.set({ pid: pack.id});
    await VersionService.updateVersion(ver.id, { package: JSON.stringify(ver.package) });
    await VersionService.getVersionCache(pack.id).set({ pid: pack.id });
  }

  async getMaintainersByPid(pid: number) {
    return await this.ctx.dbo.maintainer.findAll({
      attributes: ['account'],
      where: { pid }
    })
  }

  async createNewMaintainer(account: string, pid: number) {
    return await this.ctx.dbo.maintainer.create({
      account, pid
    });
  }

  async deleteMaintainer(account: string, pid: number) {
    console.log('delete', account, pid);
    return await this.ctx.dbo.maintainer.destroy({
      where: {
        account,
        pid
      }
    });
  }
}