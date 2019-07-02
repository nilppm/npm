import { NPMContext } from '../index';
import { Component, NELTS_CONFIGS } from '@nelts/nelts';
import { Cacheable } from '@nelts/orm';

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
    return await this.ctx.dbo.tag.create({
      name, pid, vid
    });
  }

  async getVidAndNameByPid(pid: number) {
    return await this.ctx.dbo.tag.findAll({
      attributes: ['vid', 'name'],
      where: { pid }
    });
  }
}