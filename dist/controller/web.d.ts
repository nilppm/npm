import { Component } from '@nelts/nelts';
import { NPMContext, NPMWorkerPlugin } from '../index';
export default class WebController extends Component.Controller<NPMWorkerPlugin> {
    constructor(app: NPMWorkerPlugin);
    getUserWithScopeAndPkgname(ctx: NPMContext): Promise<void>;
    getUserWithPkgname(ctx: NPMContext): Promise<void>;
    getUserWithScopeAndPkgnameUseVersion(ctx: NPMContext): Promise<void>;
    getUserWithPkgnameUseVersion(ctx: NPMContext): Promise<void>;
    searchPackages(ctx: NPMContext): Promise<void>;
}
