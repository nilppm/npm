/// <reference types="node" />
import { NPMContext } from '../index';
import { Component } from '@nelts/nelts';
export default class PackageService extends Component.Service<NPMContext> {
    private configs;
    constructor(ctx: NPMContext);
    searchFromDBO(keyword: string, size?: number): Promise<{
        objects: any[];
        total: number;
        time: Date;
    }>;
    searchFromNpm(keyword: string, size?: number): Promise<unknown>;
    unPublish(filepath: string, rev: string): Promise<any>;
    clearPackage(pid: number): Promise<void>;
    removeAllByPid(pid: number): Promise<number>;
    removePackageCache(pid: number, pathname: string): Promise<void>;
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
    getSinglePackageById(id: number, ...attributes: string[]): Promise<import("../sequelize/package").default>;
    createNewPackage(scope: string, name: string, pathname: string): Promise<import("../sequelize/package").default>;
    updatPackage(pkg: any): Promise<void>;
    publish(account: string, pkg: any): Promise<void>;
    updateModifiedTime(pid: number): Promise<[number, import("../sequelize/package").default[]]>;
}
