import { Component, Decorator, Plugin, Scope, Context, Extra } from '@nelts/nelts';
const Controller = Decorator.Controller;

// Use scope function
export default Scope((app: Plugin) => {
  @Controller.Prefix('/-/user')
  class UserController extends Component.Controller {
    constructor(app: Plugin) {
      super(app);
    }

    @Controller.Get('/org.couchdb.user:account(^:.+$)')
    async getUser(ctx: Context) {
      const service = new this.service.UserService(ctx);
      ctx.body = await service.showUser(ctx.params.account.substring(1));
      ctx.status = 201;
    }

    @Controller.Put('/org.couchdb.user:account(^:.+$)')
    @Controller.Request.Dynamic.Loader(Extra.Body<Context>({ isapi: true }))
    async addUser(ctx: Context) {
      const service = new this.service.UserService(ctx);
      ctx.body = await service.addUser(ctx.request.body);
      ctx.status = 201;
    }
  }

  return UserController;
});