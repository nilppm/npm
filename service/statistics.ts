import { NPMContext } from '../index';
import { Component, NELTS_CONFIGS } from '@nelts/nelts';
import { QueryTypes } from 'sequelize';

export default class StatisticsService extends Component.Service<NPMContext> {
  private configs: NELTS_CONFIGS;
  constructor(ctx: NPMContext) {
    super(ctx);
    this.configs = ctx.app.configs;
  }

  async SomeDay(day: number, pathname: string, version?: string) {
    const a: string[] = [], b: any[] = [day];
    a.push('pathname=?'); b.push(pathname);
    if (version) a.push('version=?'); b.push(version);
    return await this.ctx.sequelize.query(`
      SELECT COUNT(id) AS downloads, DATE_FORMAT(ctime, '%Y-%m-%d') AS day 
      FROM statistics 
      WHERE DATE_SUB(CURDATE(),INTERVAL ? DAY) <= DATE(ctime) AND ${a.join(' AND ')}
      GROUP BY day`, 
    {
      replacements: b,
      type: QueryTypes.SELECT
    });
  }

  async Week(pathname: string, version?: string) {
    return await this.SomeDay(7, pathname, version);
  }

  async Month(pathname: string, version?: string) {
    return await this.SomeDay(30, pathname, version);
  }
}