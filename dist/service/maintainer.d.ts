import { NPMContext } from '../index';
import { Component } from '@nelts/nelts';
declare type MaintainerData = {
    name: string;
    email?: string;
    account?: string;
};
export default class MaintainerService extends Component.Service<NPMContext> {
    private configs;
    constructor(ctx: NPMContext);
    removeAllByPid(pid: number): Promise<number>;
    getMaintainersCache(pid: number): Promise<any>;
    checkMaintainerAllow(account: string, maintainers: MaintainerData[]): boolean;
    addOwner(rev: string, pathname: string, maintainers: MaintainerData[]): Promise<void>;
    getMaintainersByPid(pid: number): Promise<import("../sequelize/maintainer").default[]>;
    createNewMaintainer(account: string, pid: number): Promise<import("../sequelize/maintainer").default>;
    deleteMaintainer(account: string, pid: number): Promise<number>;
}
export {};
