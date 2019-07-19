import { NPMContext, NPMWorkerPlugin } from '../index';
import { Component, Decorator, Scope, Extra } from '@nelts/nelts';
const Controller = Decorator.Controller;

// Use scope function
export default Scope<NPMWorkerPlugin>(app => {
  @Controller.Prefix('/-/package')
  class IndexController extends Component.Controller<NPMWorkerPlugin> {
    constructor(app: NPMWorkerPlugin) {
      super(app);
    }

    @Controller.Get('/@:scope/dist-tags')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScope)
    async getPackageDistTagsWithScope(ctx: NPMContext) {
      const service = new this.service.TagService(ctx);
      ctx.body = await service.getDistTags(ctx.pkg);
    }

    @Controller.Get('/@:scope/:pkgname/dist-tags')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname)
    async getPackageDistTagsWithScopeAndPkgname(ctx: NPMContext) {
      const service = new this.service.TagService(ctx);
      ctx.body = await service.getDistTags(ctx.pkg);
    }

    @Controller.Put('/@:scope/dist-tags/:tag')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScope)
    @Controller.Request.Dynamic.Loader(Extra.Body<NPMContext>({ istext: true }))
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async putPackageDistTagsWithScope(ctx: NPMContext) {
      const service = new this.service.TagService(ctx);
      ctx.body = await service.putDistTags(ctx.pkg, ctx.params.tag, ctx.request.body);
    }

    @Controller.Put('/@:scope/:pkgname/dist-tags/:tag')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname)
    @Controller.Request.Dynamic.Loader(Extra.Body<NPMContext>({ istext: true }))
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async putPackageDistTagsWithScopeAndPkgname(ctx: NPMContext) {
      const service = new this.service.TagService(ctx);
      ctx.body = await service.putDistTags(ctx.pkg, ctx.params.tag, ctx.request.body);
    }

    @Controller.Delete('/@:scope/dist-tags/:tag')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScope)
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async deletePackageDistTagsWithScope(ctx: NPMContext) {
      const service = new this.service.TagService(ctx);
      ctx.body = await service.deleteDistTags(ctx.pkg, ctx.params.tag);
    }

    @Controller.Delete('/@:scope/:pkgname/dist-tags/:tag')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname)
    @Controller.Middleware(app.middleware.UserLoginMiddleware)
    async deletePackageDistTagsWithScopeAndPkgname(ctx: NPMContext) {
      const service = new this.service.PackageService(ctx);
      ctx.body = await service.unPublish(ctx.pkg.pathname, ctx.params.tag, ctx.account);
    }
  }

  return IndexController;
});