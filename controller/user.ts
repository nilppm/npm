import { Component, Decorator, WorkerPlugin, Scope, Extra } from '@nelts/nelts';
import { NPMContext } from '../index';
const Controller = Decorator.Controller;

// Use scope function
export default Scope<WorkerPlugin>(app => {
  @Controller.Prefix('/-/user')
  class UserController extends Component.Controller {
    constructor(app: WorkerPlugin) {
      super(app);
    }

    @Controller.Get('/org.couchdb.user:account(^:.+$)')
    async getUser(ctx: NPMContext) {
      const service = new this.service.UserService(ctx);
      ctx.body = await service.showUser(ctx.params.account.substring(1));
      ctx.status = 201;
    }

    @Controller.Put('/org.couchdb.user:account(^:.+$)')
    @Controller.Request.Dynamic.Loader(Extra.Body<NPMContext>({ isapi: true }))
    async addUser(ctx: NPMContext) {
      const service = new this.service.UserService(ctx);
      ctx.body = await service.addUser(ctx.request.body);
      ctx.status = 201;
    }
  }

  return UserController;
});