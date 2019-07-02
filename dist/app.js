"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (app) => {
    app.on('ServerStarted', () => console.log('nelts life [ServerStarted] invoked.'));
    app.on('ServerStopping', () => console.log('nelts life [ServerStopping] invoked.'));
    app.on('ServerStopped', () => console.log('nelts life [ServerStopped] invoked.'));
    app.on('ContextStaticValidator', (ctx) => console.log('nelts context life [ContextStaticValidator] invoked.'));
    app.on('ContextStaticFilter', (ctx) => console.log('nelts context life [ContextStaticFilter] invoked.'));
    app.on('ContextDynamicLoader', (ctx) => console.log('nelts context life [ContextDynamicLoader] invoked.'));
    app.on('ContextDynamicValidator', (ctx) => console.log('nelts context life [ContextDynamicValidator] invoked.'));
    app.on('ContextDynamicFilter', (ctx) => console.log('nelts context life [ContextDynamicFilter] invoked.'));
    app.on('ContextGuard', (ctx) => console.log('nelts context life [ContextGuard] invoked.'));
    app.on('ContextMiddleware', (ctx) => console.log('nelts context life [ContextMiddleware] invoked.'));
    app.on('ContextRuntime', (ctx) => console.log('nelts context life [ContextRuntime] invoked.'));
    app.on('ContextResponse', (ctx) => console.log('nelts context life [ContextResponse] invoked.'));
    app.on('ContextResolve', (ctx) => console.log('nelts context life status [ContextResolve] invoked.'));
    app.on('ContextReject', (e, ctx) => console.log('nelts context life status [ContextReject] invoked.'));
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
    app.on('ServerRequest', (req, res) => console.log(` - [${req.method}] inComingRequest:`, req.url));
    app.on('NpmPrepareLogin', (ctx, v) => console.log(` - [v${v}] NpmPrepareLogin:`, ctx.request.body));
};
