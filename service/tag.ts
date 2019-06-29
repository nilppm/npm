import { Component, Context, NELTS_CONFIGS } from '@nelts/nelts';

export default class TagService extends Component.Service {
  private configs: NELTS_CONFIGS;
  constructor(ctx: Context) {
    super(ctx);
    this.configs = ctx.app.configs;
  }

  async getChunksByPidAndName(pid: number, name: string) {
    return await this.ctx.sequelize.cpm.tag.findAll({
      attributes: ['vid'],
      where: {
        pid, name
      }
    });
  }

  async createNewTag(pid: number, name: string, vid: number) {
    return await this.ctx.sequelize.cpm.tag.create({
      name, pid, vid
    });
  }
}