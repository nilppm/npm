import { Component, Context, NELTS_CONFIGS } from '@nelts/nelts';
import { getSequelizeFieldValues } from '@nelts/orm'

type MaintainerData = {
  name: string,
  email?: string,
}

export default class MaintainerService extends Component.Service {
  private configs: NELTS_CONFIGS;
  constructor(ctx: Context) {
    super(ctx);
    this.configs = ctx.app.configs;
  }

  checkMaintainerAllow(account: string, maintainers: MaintainerData[]) {
    if (this.configs.admins) {
      const admins = Array.isArray(this.configs.admins) ? this.configs.admins : [this.configs.admins];
      if (admins.indexOf(account) > -1) return true;
    }
    for (let i = 0; i < maintainers.length; i++) {
      const maintainer = maintainers[i];
      if (maintainer.name === account) return true;
    }
  }

  async getMaintainersByPid(pid: number) {
    return <MaintainerData[]>getSequelizeFieldValues(await this.ctx.sequelize.cpm.maintainer.findAll({
      attributes: [['account', 'name']],
      where: { pid }
    }))
  }

  async createNewMaintainer(account: string, pid: number) {
    return await this.ctx.sequelize.cpm.maintainer.create({
      account, pid
    });
  }
}