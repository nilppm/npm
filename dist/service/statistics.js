"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nelts_1 = require("@nelts/nelts");
const sequelize_1 = require("sequelize");
class StatisticsService extends nelts_1.Component.Service {
    constructor(ctx) {
        super(ctx);
        this.configs = ctx.app.configs;
    }
    async SomeDay(day, pathname, version) {
        const a = [], b = [day];
        a.push('pathname=?');
        b.push(pathname);
        if (version)
            a.push('version=?');
        b.push(version);
        return await this.ctx.sequelize.query(`
      SELECT COUNT(id) AS downloads, DATE_FORMAT(ctime, '%Y-%m-%d') AS day 
      FROM statistics 
      WHERE DATE_SUB(CURDATE(),INTERVAL ? DAY) <= DATE(ctime) AND ${a.join(' AND ')}
      GROUP BY day`, {
            replacements: b,
            type: sequelize_1.QueryTypes.SELECT
        });
    }
    async Week(pathname, version) {
        return await this.SomeDay(7, pathname, version);
    }
    async Month(pathname, version) {
        return await this.SomeDay(30, pathname, version);
    }
    async SomeDownloads(day) {
        return await this.ctx.sequelize.query(`
      SELECT COUNT(id) AS downloads 
      FROM statistics 
      WHERE DATE_SUB(CURDATE(),INTERVAL ? DAY) <= DATE(ctime)`, {
            replacements: [day],
            type: sequelize_1.QueryTypes.SELECT
        });
    }
}
exports.default = StatisticsService;
