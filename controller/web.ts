import { Component, Decorator, WorkerPlugin, Extra } from '@nelts/nelts';
import { NPMContext } from '../index';
import * as request from 'request';
const Controller = Decorator.Controller;

@Controller.Prefix('/api')
export default class WebController extends Component.Controller {
  constructor(app: WorkerPlugin) {
    super(app);
  }

  @Controller.Get('/package/@:scope/:pkgname')
  async getUserWithScopeAndPkgname(ctx: NPMContext) {
    const service = new this.service.WebService(ctx);
    ctx.body = await service.getPackage(`@${ctx.params.scope}/${ctx.params.pkgname}`);
  }

  @Controller.Get('/package/:pkgname')
  async getUserWithPkgname(ctx: NPMContext) {
    const service = new this.service.WebService(ctx);
    ctx.body = await service.getPackage(ctx.params.pkgname);
  }

  @Controller.Get('/package/@:scope/:pkgname/v/:version')
  async getUserWithScopeAndPkgnameUseVersion(ctx: NPMContext) {
    const service = new this.service.WebService(ctx);
    ctx.body = await service.getPackage(`@${ctx.params.scope}/${ctx.params.pkgname}`, ctx.params.version);
  }

  @Controller.Get('/package/:pkgname/v/:version')
  async getUserWithPkgnameUseVersion(ctx: NPMContext) {
    const service = new this.service.WebService(ctx);
    ctx.body = await service.getPackage(ctx.params.pkgname, ctx.params.version);
  }

  @Controller.Get('/search')
  @Controller.Request.Static.Validator.Query('q', 's', 't')
  async searchPackages(ctx: NPMContext) {
    const service = new this.service.PackageService(ctx);
    const t = Number(ctx.query.t);
    switch (t) {
      case 1: ctx.body = await service.searchFromDBO(ctx.query.q, Number(ctx.query.s)); break;
      case 2: ctx.body = await service.searchFromNpm(ctx.query.q, Number(ctx.query.s)); break;
      default: throw new Error('query.t can only be [1,2]');
    }
  }
}