import { NPMContext } from '../index';
import { Component } from '@nelts/nelts';
export default class WebService extends Component.Service<NPMContext> {
    private configs;
    constructor(ctx: NPMContext);
    getPackage(pathname: string, version?: string): Promise<any>;
    fixStatisticsFromDBO(pathname: string, properties: Promise<any>[], result: any): void;
    fixStatisticsFromNpm(pathname: string, properties: Promise<any>[], result: any): void;
    getNpmDownloadsApi(url: string): Promise<unknown>;
    fixRepo(result: any): void;
    fixUser(result: any): Promise<void>;
    fixRemoteMaintainers(result: any): void;
    formatUserAvatar(user?: {
        name: string;
        email?: string;
    }): Promise<{
        name: string;
        email: string;
        avatar: string;
        nick: string;
    }>;
    fixReadme(pathname: string, version: string): Promise<any>;
}
