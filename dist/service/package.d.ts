/// <reference types="node" />
import { NPMContext } from '../index';
import { Component } from '@nelts/nelts';
export default class PackageService extends Component.Service<NPMContext> {
    private configs;
    constructor(ctx: NPMContext);
    updatePackageCache(pid: number): Promise<void>;
    getUri(url: string, name: string, version: string): Promise<string>;
    getRemotePackageInformation(pathname: string, version?: string): Promise<any>;
    getLocalPackageByPid(pid: number, ctime: Date, mtime: Date, version?: string): Promise<any>;
    getPackageInfo(pkg: {
        pathname: string;
        version?: string;
    }): Promise<any>;
    createShasumCode(tarballBuffer: Buffer): string;
    splitPackagePathname(pathname: string): {
        scope: string;
        alias: string;
    };
    getSinglePackageByPathname(pathname: string, ...attributes: string[]): Promise<import("../sequelize/package").default>;
    createNewPackage(scope: string, name: string, pathname: string): Promise<import("../sequelize/package").default>;
    publish(account: string, pkg: any): Promise<void>;
    updateModifiedTime(pid: number): Promise<[number, import("../sequelize/package").default[]]>;
}
