import { Plugin, Context } from '@nelts/nelts';

export default (app: Plugin) => {
  app.on('props', configs => console.log('nelts props received:', configs));
  app.on('ServerStarted', () => console.log('nelts life [ServerStarted] invoked.'));
  app.on('ServerStopping', () => console.log('nelts life [ServerStopping] invoked.'));
  app.on('ServerStopped', () => console.log('nelts life [ServerStopped] invoked.'));
  app.on('ContextStart', (ctx: Context) => console.log('nelts context life [ContextStart] invoked.'));
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
}