import { NPMContext } from '../index';
import { Component } from '@nelts/nelts';
export interface UserInfo {
    account: string;
    name: string;
    email: string;
    avatar: string;
    scopes: string[];
    extra: {
        [name: string]: any;
    };
}
export declare type AddUserRequestData = {
    _id: string;
    name: string;
    password: string;
    type: string;
    roles: string[];
    date: string;
};
interface AddUserResponseData {
    ok: boolean;
    id: string;
    rev: string;
}
export default class UserService extends Component.Service<NPMContext> {
    private configs;
    constructor(ctx: NPMContext);
    userCache(account: string): Promise<any>;
    showUser(account: string): Promise<{
        _id: string;
        name: any;
        email: any;
        type: string;
        avatar: any;
        scopes: any;
        extra: any;
    }>;
    getUserByAccount(account: string): Promise<import("../sequelize/user").default[]>;
    updateUserByAccount(data: {
        [name: string]: any;
    }, account: string): Promise<[number, import("../sequelize/user").default[]]>;
    createUser(data: {
        [name: string]: any;
    }): Promise<import("../sequelize/user").default>;
    addUser(data: AddUserRequestData): Promise<AddUserResponseData>;
}
export {};
