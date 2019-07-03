import { NPMContext } from '../index';
import { Component } from '@nelts/nelts';
export default class VersionService extends Component.Service<NPMContext> {
    constructor(ctx: NPMContext);
    removeAllByPid(pid: number): Promise<number>;
    findLatestVersion(pid: number, ctime: Date): Promise<import("../sequelize/version").default>;
    getVersionCache(pid: number): Promise<{
        [name: string]: any;
    }>;
    checkVersionAllow(version: string, versions: string[]): boolean;
    getVersionsByPid(pid: number, ...args: string[]): Promise<import("../sequelize/version").default[]>;
    getVersionByPidAndName(pid: number, name: string, ...args: string[]): Promise<import("../sequelize/version").default>;
    createNewVersion(options: object): Promise<import("../sequelize/version").default>;
    getSingleVersionByRev(rev: string, ...attributes: string[]): Promise<import("../sequelize/version").default>;
    updateVersion(id: number, data: object): Promise<[number, import("../sequelize/version").default[]]>;
    update(pid: number, version: any): Promise<1 | 0>;
    deleteVersion(vid: number): Promise<number>;
    getCountOfPid(pid: number): Promise<number>;
}
