"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serveStatic = require("serve-static");
const path = require("path");
const fs = require("fs");
exports.default = (plu) => {
    plu.on('props', async (configs) => await plu.getComponent('@nelts/orm').props({
        sequelize: configs.sequelize,
        redis: configs.redis,
        redis_prefix: configs.redis_prefix,
    }));
    plu.on('ContextStart', (ctx) => {
        ctx.on('error', (err) => {
            ctx.status = err.status || 422;
            ctx.body = {
                status: ctx.status,
                error: err.message,
            };
        });
    });
    let staticDictionary = path.resolve(__dirname, 'static');
    if (!fs.existsSync(staticDictionary))
        staticDictionary = path.resolve(__dirname, '../static');
    plu.app.use(serveStatic(staticDictionary, {
        'index': ['index.html', 'index.htm']
    }));
    plu.on('NpmPrepareLogin', async (ctx, v) => {
        if (typeof plu.configs.npmLogin === 'function') {
            await plu.configs.npmLogin(ctx, v);
        }
    });
};
