"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
async function Total(ctx) {
    const StatisticsService = new ctx.app.service.StatisticsService(ctx);
    const packages = await ctx.dbo.package.count();
    const users = await ctx.dbo.user.count();
    const versions = await ctx.dbo.version.count();
    const downloads = await ctx.dbo.statistics.count();
    const nfs = fs.statSync(ctx.app.configs.nfs);
    const [dayDownloads, weekDownloads, monthDownloads] = await Promise.all([
        StatisticsService.SomeDownloads(1).then((data) => data[0].downloads),
        StatisticsService.SomeDownloads(7).then((data) => data[0].downloads),
        StatisticsService.SomeDownloads(30).then((data) => data[0].downloads)
    ]);
    return {
        db_name: 'NILPPM - CPM',
        data_size: nfs.size,
        total: {
            package: packages,
            user: users,
            version: versions,
            download: downloads,
            dayDownloads,
            weekDownloads,
            monthDownloads
        }
    };
}
exports.default = Total;
