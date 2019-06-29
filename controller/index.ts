import { Component, Decorator, Plugin, Context, Scope, Extra } from '@nelts/nelts';
const Controller = Decorator.Controller;

/**
 * package uri mode
 *  - `/vue`                    /:pkgname
 *  - `/vue/1.0.0`              /:pkgname/:version
 *  - `/@nelts%2fnelts`         /@:scope
 *  - `/@nelts%2fnelts/1.0.0`   /@:scope/:version
 *  - `/@nelts/nelts`           /@:scope/:pkgname
 *  - `/@nelts/nelts/1.0.0`     /@:scope/:pkgname/:version
 */

// Use scope function
export default Scope((app: Plugin) => {
  @Controller.Prefix()
  class IndexController extends Component.Controller {
    constructor(app: Plugin) {
      super(app);
    }

    @Controller.Get('/@:scope/:pkgname/:version')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopePkgnameAndVersion)
    async GetPackageInformationWithScopePkgnameAndVersion(ctx: Context) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.getPackageInfo(ctx.pkg);
    }

    @Controller.Get('/@:scope/:pkgname')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname)
    async GetPackageInformationWithScopeAndPkgname(ctx: Context) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.getPackageInfo(ctx.pkg);
    }

    @Controller.Get('/@:scope')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScope)
    async GetPackageInformationWithScope(ctx: Context) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.getPackageInfo(ctx.pkg);
    }

    @Controller.Get('/:pkgname/:version')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithPkgnameAndVersion)
    async GetPackageInformationWithPkgnameAndVersion(ctx: Context) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.getPackageInfo(ctx.pkg);
    }


    @Controller.Get('/:pkgname')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithPkgname)
    async GetPackageInformationWithPkgname(ctx: Context) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.getPackageInfo(ctx.pkg);
    }

    @Controller.Post('/-/v:v(\\d+)/login')
    @Controller.Request.Dynamic.Loader(Extra.Body<Context>({ isapi: true }))
    async PrepareToLogin(ctx: Context) {
      const v = Number(ctx.params.v);
      await ctx.app.root.broadcast('NpmPrepareLogin', ctx, v);
      ctx.status = 422;
    }

    @Controller.Put('/@:scope')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScope)
    @Controller.Request.Dynamic.Loader(Extra.Body<Context>({ isapi: true }))
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async putPackageWithScope(ctx: Context) {
      console.log(ctx.request.headers, ctx.pkg, ctx.request.body)
      ctx.body = ctx.pkg;
    }

    @Controller.Put('/@:scope/:pkgname')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname)
    @Controller.Request.Dynamic.Loader(Extra.Body<Context>({ isapi: true }))
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async putPackageWithScopeAndPkgname(ctx: Context) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.publish(ctx.account, ctx.request.body);
    }
  }

  return IndexController;
});