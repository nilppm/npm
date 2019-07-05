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

  @Controller.Post('/package/github/repo/metadata')
  @Controller.Request.Dynamic.Loader(Extra.Body<NPMContext>({ isapi: true }))
  async getGithubCounts(ctx: NPMContext) {
    const body = ctx.request.body;
    ctx.body = await new Promise((resolve, reject) => {
      const url = 'https://api.github.com/repos/' + body.pathname;
      request.get(url, (err: Error, response: request.Response, body: string) => {
        if (err) return reject(err);
        if (response.statusCode >= 300 || response.statusCode < 200) return reject(new Error(response.statusMessage));
        resolve(body);
      });
    });
    ctx.type = 'json';
  }
}