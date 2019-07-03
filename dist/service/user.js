"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const nelts_1 = require("@nelts/nelts");
const orm_1 = require("@nelts/orm");
class UserService extends nelts_1.Component.Service {
    constructor(ctx) {
        super(ctx);
        this.configs = ctx.app.configs;
    }
    async userCache(account) {
        const users = await this.ctx.dbo.user.findAll({
            where: {
                account
            }
        });
        if (users.length) {
            const userinfo = users[0].dataValues;
            userinfo.scopes = JSON.parse(userinfo.scopes);
            userinfo.extra = JSON.parse(userinfo.extra);
            const result = userinfo;
            return result;
        }
    }
    async showUser(account) {
        const cache = await this.userCache(account);
        let user = await cache.get({ account });
        if (!user) {
            const userinfo = typeof this.configs.getUserInfo === 'function' ? await this.configs.getUserInfo(account) : {
                account,
                name: account,
                email: this.configs.defaultEmailSuffix ? account + this.configs.defaultEmailSuffix : null,
                avatar: 'https://i.loli.net/2017/08/21/599a521472424.jpg',
                scopes: ['@' + account],
                extra: {}
            };
            await this.ctx.dbo.user.create({
                account: userinfo.account,
                name: userinfo.name,
                email: userinfo.email,
                avatar: userinfo.avatar,
                scopes: JSON.stringify(userinfo.scopes),
                extra: JSON.stringify(userinfo.extra),
            });
            user = await cache.set({ account });
        }
        if (!user)
            throw new Error('Cannot find user:' + account);
        return {
            _id: 'org.couchdb.user:' + user.account,
            name: user.name,
            email: user.email,
            type: 'user',
            avatar: user.avatar,
            scopes: user.scopes,
            extra: user.extra,
        };
    }
    async getUserByAccount(account) {
        return await this.ctx.dbo.user.findAll({
            attributes: ['id'],
            where: {
                account
            }
        });
    }
    async updateUserByAccount(data, account) {
        return await this.ctx.dbo.user.update(data, {
            where: {
                account
            }
        });
    }
    async createUser(data) {
        return await this.ctx.dbo.user.create(data);
    }
    async addUser(data) {
        let userinfo;
        const rev = Buffer.from(data.name + ':' + data.password, 'utf8').toString('base64');
        if (typeof this.configs.userLogin !== 'function') {
            userinfo = {
                account: data.name,
                name: data.name,
                email: this.configs.defaultEmailSuffix ? data.name + this.configs.defaultEmailSuffix : null,
                avatar: 'https://i.loli.net/2017/08/21/599a521472424.jpg',
                scopes: ['@' + data.name],
                extra: {}
            };
        }
        else {
            userinfo = await this.configs.userLogin(data.name, data.password, new Date(data.date));
        }
        if (Array.isArray(this.configs.scopes)) {
            this.configs.scopes.forEach(scope => {
                if (!scope.startsWith('@'))
                    return;
                const index = userinfo.scopes.indexOf(scope);
                if (index === -1)
                    userinfo.scopes.push(scope);
            });
        }
        const findResults = await this.getUserByAccount(userinfo.account).catch(console.log);
        if (findResults && findResults.length) {
            await this.updateUserByAccount({
                name: userinfo.name,
                email: userinfo.email,
                avatar: userinfo.avatar,
                scopes: JSON.stringify(userinfo.scopes),
                extra: JSON.stringify(userinfo.extra),
                mtime: new Date(data.date),
            }, userinfo.account);
        }
        else {
            await this.createUser({
                account: userinfo.account,
                name: userinfo.name,
                email: userinfo.email,
                avatar: userinfo.avatar,
                scopes: JSON.stringify(userinfo.scopes),
                extra: JSON.stringify(userinfo.extra),
                ctime: new Date(data.date),
            });
        }
        const cache = await this.userCache(userinfo.account);
        await cache.set({ account: userinfo.account });
        await this.ctx.redis.set(':user:expire:' + rev, userinfo.account, this.configs.loginExpire);
        return {
            ok: true,
            id: 'org.couchdb.user:' + userinfo.account,
            rev
        };
    }
}
__decorate([
    orm_1.Cacheable('/user/info/:account'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserService.prototype, "userCache", null);
exports.default = UserService;
