"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (app) => {
    app.on('props', async (configs) => await app.getComponent('@nelts/orm').props({
        sequelize: configs.sequelize,
        redis: configs.redis,
        redis_prefix: configs.redis_prefix,
    }));
    app.on('ContextStart', (ctx) => {
        ctx.on('error', (err) => {
            ctx.status = err.status || 422;
            ctx.body = {
                error: err.message,
            };
        });
    });
};
