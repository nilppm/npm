import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { NPMContext, NPMWorkerPlugin } from '../index';
import Total from '../lib/total';
import { Component, Decorator, Scope, Extra, ContextError } from '@nelts/nelts';
const Controller = Decorator.Controller;

let CPM_CACHE: {[name: string]: any} = {};
let CPM_TIME = 0;

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
export default Scope<NPMWorkerPlugin>(app => {
  @Controller.Prefix()
  class IndexController extends Component.Controller<NPMWorkerPlugin> {
    constructor(app: NPMWorkerPlugin) {
      super(app);
    }

    @Controller.Get('/metadata')
    async metadata(ctx: NPMContext) {
      let pkgfile = path.resolve(__dirname, '../package.json');
      if (!fs.existsSync(pkgfile)) pkgfile = path.resolve(__dirname, '../../package.json');
      const project = require(pkgfile);
      if (Date.now() - CPM_TIME > 10 * 60 * 1000) {
        CPM_CACHE = await Total(ctx);
        CPM_TIME = Date.now();
      }
      CPM_CACHE.version = project.version;
      CPM_CACHE.description = project.description;
      CPM_CACHE.machine = {
        cpu: {
          arch: os.arch(),
          info: os.cpus()
        },
        freemem: os.freemem(),
        hostname: os.hostname(),
        networkInterfaces: os.networkInterfaces(),
        platform: os.platform(),
        release: os.release(),
        totalmem: os.totalmem(),
        type: os.type(),
        uptime: os.uptime(),
        loadavg: os.loadavg()
      }
      ctx.body = CPM_CACHE;
    }

    @Controller.Get('/download/@:scope/:pkgname')
    @Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname)
    async download(ctx: NPMContext) {
      const file = path.resolve(app.configs.nfs, ctx.pkg.pathname);
      if (!file.endsWith('.tgz')) throw new Error('invaild package suffix extion.');
      if (!fs.existsSync(file)) {
        const err: ContextError = new Error('cannot find the package');
        err.status = 404;
        throw err;
      }
      if (ctx.app.configs.statistics) {
        const i = ctx.pkg.pathname.lastIndexOf('-');
        const str = ctx.pkg.pathname.substring(i + 1);
        const pathname = ctx.pkg.pathname.substring(0, i);
        const j = str.lastIndexOf('.tgz');
        const version = str.substring(0, j);
        if (/^\d+\.\d+\.\d+$/.test(version)) {
          ctx.dbo.statistics.create({
            pathname,
            version,
          });
        }
      }
      ctx.body = fs.createReadStream(file);
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