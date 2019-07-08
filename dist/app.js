"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    plu.app.use(async (req, res, next) => {
        console.log(` - [${req.method}] inComingRequest:`, req.url);
        await next();
    });
    plu.on('NpmPrepareLogin', async (ctx, v) => {
        if (typeof plu.configs.npmLogin === 'function') {
            await plu.configs.npmLogin(ctx, v);
        }
    });
};
