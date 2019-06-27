import { Component, Plugin, Context } from '@nelts/nelts';
export default class IndexController extends Component.Controller {
    constructor(app: Plugin);
    Home(ctx: Context): Promise<void>;
}
