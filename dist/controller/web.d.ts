import { Component, WorkerPlugin } from '@nelts/nelts';
import { NPMContext } from '../index';
export default class WebController extends Component.Controller {
    constructor(app: WorkerPlugin);
    getUserWithScopeAndPkgname(ctx: NPMContext): Promise<void>;
    getUserWithPkgname(ctx: NPMContext): Promise<void>;
    getUserWithScopeAndPkgnameUseVersion(ctx: NPMContext): Promise<void>;
    getUserWithPkgnameUseVersion(ctx: NPMContext): Promise<void>;
    searchPackages(ctx: NPMContext): Promise<void>;
}
