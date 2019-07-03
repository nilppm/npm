import { NPMContext } from '../index';
import { Component, Decorator, WorkerPlugin, Scope, Extra } from '@nelts/nelts';
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
export default Scope<WorkerPlugin>(app => {
  @Controller.Prefix()
  class IndexController extends Component.Controller {
    constructor(app: WorkerPlugin) {
      super(app);
    }

    @Controller.Get('/@:scope/:pkgname/:version')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopePkgnameAndVersion)
    async GetPackageInformationWithScopePkgnameAndVersion(ctx: NPMContext) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.getPackageInfo(ctx.pkg);
    }

    @Controller.Get('/@:scope/:pkgname')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname)
    async GetPackageInformationWithScopeAndPkgname(ctx: NPMContext) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.getPackageInfo(ctx.pkg);
    }

    @Controller.Get('/@:scope')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScope)
    async GetPackageInformationWithScope(ctx: NPMContext) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.getPackageInfo(ctx.pkg);
    }

    @Controller.Get('/:pkgname/:version')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithPkgnameAndVersion)
    async GetPackageInformationWithPkgnameAndVersion(ctx: NPMContext) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.getPackageInfo(ctx.pkg);
    }


    @Controller.Get('/:pkgname')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithPkgname)
    async GetPackageInformationWithPkgname(ctx: NPMContext) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.getPackageInfo(ctx.pkg);
    }

    @Controller.Post('/-/v:v(\\d+)/login')
    @Controller.Request.Dynamic.Loader(Extra.Body<NPMContext>({ isapi: true }))
    async PrepareToLogin(ctx: NPMContext) {
      const v = Number(ctx.params.v);
      await ctx.app.root.broadcast('NpmPrepareLogin', ctx, v);
      ctx.status = 422;
    }

    @Controller.Put('/@:scope')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScope)
    @Controller.Request.Dynamic.Loader(Extra.Body<NPMContext>({ isapi: true }))
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async putPackageWithScope(ctx: NPMContext) {
      const service = new this.service.PackageService(ctx);
      if (ctx.request.body._attachments) {
        await service.publish(ctx.account, ctx.request.body);
      } else {
        await service.updatPackage(ctx.request.body);
      }
      ctx.body = { ok: true };
    }

    @Controller.Put('/@:scope/:pkgname')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname)
    @Controller.Request.Dynamic.Loader(Extra.Body<NPMContext>({ isapi: true }))
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async putPackageWithScopeAndPkgname(ctx: NPMContext) {
      const pkg = ctx.request.body;
      const version = pkg.version;
      const service = new this.service.PackageService(ctx);
      if (pkg._attachments) {
        await service.publish(ctx.account, ctx.request.body);
      } else if (pkg.versions && pkg.versions[version].deprecated) {
        await service.deprecate(pkg.name, version, pkg.versions[version].deprecated);
      }
      ctx.body = { ok: true };
    }

    @Controller.Put('/@:scope/-rev/:rev')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScope)
    @Controller.Request.Dynamic.Loader(Extra.Body<NPMContext>({ isapi: true }))
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async npmAddOwnerUserWithScope(ctx: NPMContext) {
      const service = new this.service.MaintainerService(ctx);
      await service.addOwner(ctx.params.rev, ctx.pkg.pathname, ctx.request.body.maintainers);
      ctx.body = {
        ok: true
      }
    }

    @Controller.Put('/@:scope/:pkgname/-rev/:rev')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname)
    @Controller.Request.Dynamic.Loader(Extra.Body<NPMContext>({ isapi: true }))
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async npmAddOwnerUserWithScopeAndPkgname(ctx: NPMContext) {
      const service = new this.service.MaintainerService(ctx);
      await service.addOwner(ctx.params.rev, ctx.pkg.pathname, ctx.request.body.maintainers);
      ctx.body = {
        ok: true
      }
    }

    @Controller.Delete('/download/@:scope/:pkgname/-rev/:rev')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname)
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async unPublishWithLocal(ctx: NPMContext) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.unPublish(ctx.pkg.pathname, ctx.params.rev);
    }

    @Controller.Delete('/@:scope/-rev/:rev')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScope)
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async unPublishWithScope(ctx: NPMContext) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.unPublish(ctx.pkg.pathname, ctx.params.rev);
    }

    @Controller.Delete('/@:scope/:pkgname/-rev/:rev')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname)
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async unPublishWithScopeAndName(ctx: NPMContext) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.unPublish(ctx.pkg.pathname, ctx.params.rev);
    }
  }

  return IndexController;
});