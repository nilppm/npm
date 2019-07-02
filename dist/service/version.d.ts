import { NPMContext } from '../index';
import { Component } from '@nelts/nelts';
export default class VersionService extends Component.Service<NPMContext> {
    constructor(ctx: NPMContext);
    getVersionCache(pid: number): Promise<{
        [name: string]: any;
    }>;
    checkVersionAllow(version: string, versions: string[]): boolean;
    getVersionsByPid(pid: number, ...args: string[]): Promise<import("../sequelize/version").default[]>;
    createNewVersion(options: object): Promise<import("../sequelize/version").default>;
    getSingleVersionByRev(rev: string, ...attributes: string[]): Promise<import("../sequelize/version").default>;
    updateVersion(id: number, data: object): Promise<[number, import("../sequelize/version").default[]]>;
}
