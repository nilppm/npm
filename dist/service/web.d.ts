import { NPMContext } from '../index';
import { Component } from '@nelts/nelts';
export default class WebService extends Component.Service<NPMContext> {
    private configs;
    constructor(ctx: NPMContext);
    getPackage(pathname: string, version?: string): Promise<any>;
    fixRepo(result: any): void;
    fixUser(result: any): Promise<void>;
    formatUserAvatar(user: {
        name: string;
        email?: string;
    }): Promise<{
        name: string;
        email: string;
        avatar: string;
        nick: string;
    }>;
}
