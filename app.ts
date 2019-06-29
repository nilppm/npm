import { Plugin, Context, ContextError } from '@nelts/nelts';
import { IncomingMessage, ServerResponse } from 'http';

export default (app: Plugin) => {
  
  app.on('ServerStarted', () => console.log('nelts life [ServerStarted] invoked.'));
  app.on('ServerStopping', () => console.log('nelts life [ServerStopping] invoked.'));
  app.on('ServerStopped', () => console.log('nelts life [ServerStopped] invoked.'));
  app.on('ContextStaticValidator', (ctx: Context) => console.log('nelts context life [ContextStaticValidator] invoked.'));
  app.on('ContextStaticFilter', (ctx: Context) => console.log('nelts context life [ContextStaticFilter] invoked.'));
  app.on('ContextDynamicLoader', (ctx: Context) => console.log('nelts context life [ContextDynamicLoader] invoked.'));
  app.on('ContextDynamicValidator', (ctx: Context) => console.log('nelts context life [ContextDynamicValidator] invoked.'));
  app.on('ContextDynamicFilter', (ctx: Context) => console.log('nelts context life [ContextDynamicFilter] invoked.'));
  app.on('ContextGuard', (ctx: Context) => console.log('nelts context life [ContextGuard] invoked.'));
  app.on('ContextMiddleware', (ctx: Context) => console.log('nelts context life [ContextMiddleware] invoked.'));
  app.on('ContextRuntime', (ctx: Context) => console.log('nelts context life [ContextRuntime] invoked.'));
  app.on('ContextResponse', (ctx: Context) => console.log('nelts context life [ContextResponse] invoked.'));
  app.on('ContextResolve', (ctx: Context) => console.log('nelts context life status [ContextResolve] invoked.'));
  app.on('ContextReject', (e: Error, ctx: Context) => console.log('nelts context life status [ContextReject] invoked.'));

  // 向子依赖注入参数
  app.on('props', async configs => await app.getComponent('@nelts/orm').props({
    sequelize: configs.sequelize,
    redis: configs.redis,
    redis_prefix: configs.redis_prefix,
  }));

  // 请求级别错误容错处理
  app.on('ContextStart', (ctx: Context) => {
    ctx.on('error', (err: ContextError) => {
      ctx.status = err.status || 422;
      ctx.body = {
        error: err.message,
      }
    });
  });

  // 辅助请求拦截事件
  app.on('ServerRequest', (req: IncomingMessage, res: ServerResponse) => console.log(` - [${req.method}] inComingRequest:`, req.url));

  // npm prepare login data
  app.on('NpmPrepareLogin', (ctx: Context, v: number) => console.log(` - [v${v}] NpmPrepareLogin:`, ctx.request.body));
}