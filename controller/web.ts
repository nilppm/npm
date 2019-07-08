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
}