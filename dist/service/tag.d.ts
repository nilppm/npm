import { NPMContext, NPMWorkerPlugin } from '../index';
import { Component } from '@nelts/nelts';
export default class TagService extends Component.Service<NPMWorkerPlugin, NPMContext> {
    private configs;
    constructor(ctx: NPMContext);
    getTagsCache(pid: number): Promise<{
        [name: string]: number;
    }>;
    getChunksByPidAndName(pid: number, name: string): Promise<import("../sequelize/tag").default[]>;
    createNewTag(pid: number, name: string, vid: number): Promise<import("../sequelize/tag").default | [number, import("../sequelize/tag").default[]]>;
    deleteTag(pid: number, name: string): Promise<void>;
    getVidAndNameByPid(pid: number): Promise<import("../sequelize/tag").default[]>;
    updateVidOnNamesByPid(pid: number, vid: number, names: string[]): Promise<[number, import("../sequelize/tag").default[]]>;
    removeAllByPid(pid: number): Promise<number>;
    getDistTags(pkg: {
        pathname: string;
        version?: string;
    }): Promise<any>;
    putDistTags(pkg: {
        pathname: string;
        version?: string;
    }, tag: string, body: string): Promise<void>;
    deleteDistTags(pkg: {
        pathname: string;
        version?: string;
    }, tag: string): Promise<void>;
}
