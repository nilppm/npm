import { Component, Decorator, Plugin, Context } from '@nelts/nelts';
const Controller = Decorator.Controller;

@Controller.Prefix()
export default class IndexController extends Component.Controller {
  constructor(app: Plugin) {
    super(app);
  }

  @Controller.Get()
  async Home(ctx: Context) {
    ctx.body = 'hello world';
  }
}