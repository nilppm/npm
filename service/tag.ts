import { NPMContext } from '../index';
import { Component, NELTS_CONFIGS } from '@nelts/nelts';
import { Cacheable } from '@nelts/orm';
import { Op } from 'sequelize';

export default class TagService extends Component.Service<NPMContext> {
  private configs: NELTS_CONFIGS;
  constructor(ctx: NPMContext) {
    super(ctx);
    this.configs = ctx.app.configs;
  }

  @Cacheable('/package/:pid(\\d+)/tags')
  async getTagsCache(pid: number) {
    const result = await this.getVidAndNameByPid(pid);
    const res: {[name: string]: number} = {};
    result.forEach(ret => res[ret.name] = ret.vid);
    return res;
  }

  async getChunksByPidAndName(pid: number, name: string) {
    return await this.ctx.dbo.tag.findAll({
      attributes: ['vid'],
      where: {
        pid, name
      }
    });
  }

  async createNewTag(pid: number, name: string, vid: number) {
    const result = await this.ctx.dbo.tag.findOne({
      attributes: ['id'],
      where: {
        pid,
        name
      }
    });
    if (!result) return await this.ctx.dbo.tag.create({
      name, pid, vid
    });
    return await this.ctx.dbo.tag.update({ vid }, {
      where: {
        id: result.id
      }
    });
  }

  async deleteTag(pid: number, name: string) {
    const result = await this.ctx.dbo.tag.findOne({
      attributes: ['id'],
      where: {
        pid,
        name
      }
    });
    if (result) {
      await this.ctx.dbo.tag.destroy({
        where: {
          id: result.id
        }
      });
    }
  }

  async getVidAndNameByPid(pid: number) {
    return await this.ctx.dbo.tag.findAll({
      attributes: ['vid', 'name'],
      where: { pid }
    });
  }

  async updateVidOnNamesByPid(pid: number, vid: number, names: string[]) {
    return await this.ctx.dbo.tag.update({
      vid
    },{
      where: { 
        pid,
        name: {
          [Op.in]: names
        }
      }
    });
  }

  async removeAllByPid(pid: number) {
    return await this.ctx.dbo.tag.destroy({
      where: { pid }
    });
  }

  async getDistTags(pkg: { pathname: string, version?: string }) {
    const PackageService = new this.service.PackageService(this.ctx);
    const result = await PackageService.getPackageInfo(pkg);
    if (!result) throw new Error('cannot find the package of ' + pkg.pathname);
    return result['dist-tags'];
  }

  async putDistTags(pkg: { pathname: string, version?: string }, tag: string, body: string) {
    if (!body) throw new Error('add dist-tag need a body of version');
    if (!body.startsWith('"')) throw new Error('add dist-tag need a body of start with `"`');
    body = JSON.parse(body);
    if (!/^\d+\.\d+\.\d+$/.test(body)) throw new Error('add dist-tag: body is not a version');
    const PackageService = new this.service.PackageService(this.ctx);
    const VersionService = new this.service.VersionService(this.ctx);
    const MaintainerService = new this.service.MaintainerService(this.ctx);
    const pack = await PackageService.getSinglePackageByPathname(pkg.pathname);
    if (!pack) throw new Error('cannot find the package of ' + pkg.pathname);
    const maintainers = await MaintainerService.getMaintainersByPid(pack.id);
    if (!MaintainerService.checkMaintainerAllow(this.ctx.account, maintainers)) throw new Error('you cannot use add dist-tag on this package: ' + pkg.pathname);
    const version = await VersionService.getVersionByPidAndName(pack.id, body);
    if (!version) throw new Error(`cannot find the version<${body}> in package<${pkg.pathname}> versions data.`);
    await this.createNewTag(pack.id, tag, version.id);
    await PackageService.updatePackageCache(pack.id);
  }

  async deleteDistTags(pkg: { pathname: string, version?: string }, tag: string) {
    if (tag === 'latest') throw new Error('you cannot delete the dist-tag name of latest');
    const PackageService = new this.service.PackageService(this.ctx);
    const MaintainerService = new this.service.MaintainerService(this.ctx);
    const pack = await PackageService.getSinglePackageByPathname(pkg.pathname);
    if (!pack) throw new Error('cannot find the package of ' + pkg.pathname);
    const maintainers = await MaintainerService.getMaintainersByPid(pack.id);
    if (!MaintainerService.checkMaintainerAllow(this.ctx.account, maintainers)) throw new Error('you cannot use rm dist-tag on this package: ' + pkg.pathname);
    await this.deleteTag(pack.id, tag);
    await PackageService.updatePackageCache(pack.id);
  }
}