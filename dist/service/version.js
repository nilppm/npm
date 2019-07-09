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
const sequelize_1 = require("sequelize");
class VersionService extends nelts_1.Component.Service {
    constructor(ctx) {
        super(ctx);
    }
    async removeAllByPid(pid) {
        return await this.ctx.dbo.version.destroy({
            where: { pid }
        });
    }
    async findLatestVersion(pid, ctime) {
        return await this.ctx.dbo.version.findOne({
            attributes: ['id'],
            where: {
                pid,
                ctime: {
                    [sequelize_1.Op.lt]: ctime
                }
            },
            order: [
                ['ctime', 'DESC']
            ]
        });
    }
    async getVersionCache(pid) {
        const result = await this.getVersionsByPid(pid, 'id', 'name', 'ctime', 'package', 'rev');
        const res = {};
        result.forEach(ret => {
            const string = ret.package.indexOf('%7B%22') === 0 ? decodeURIComponent(ret.package) : ret.package;
            const chunk = JSON.parse(string);
            if (ret.name !== chunk.version)
                return;
            chunk._created = ret.ctime;
            chunk._rev = ret.rev;
            res[ret.id] = chunk;
        });
        return res;
    }
    checkVersionAllow(version, versions) {
        const root = {
            items: {},
            max: 0,
        };
        versions.forEach(ver => {
            const sp = ver.split('.').map(Number);
            const MAJOR = sp[0];
            const MINOR = sp[1];
            const PATCH = sp[2];
            if (!root.items[MAJOR])
                root.items[MAJOR] = {
                    items: {},
                    max: 0,
                };
            if (MAJOR > root.max)
                root.max = MAJOR;
            if (!root.items[MAJOR].items[MINOR])
                root.items[MAJOR].items[MINOR] = {
                    items: {},
                    max: 0,
                };
            if (MINOR > root.items[MAJOR].max)
                root.items[MAJOR].max = MINOR;
            if (PATCH > root.items[MAJOR].items[MINOR].max)
                root.items[MAJOR].items[MINOR].max = PATCH;
        });
        const sp = version.split('.').map(Number);
        const MAJOR = sp[0];
        const MINOR = sp[1];
        const PATCH = sp[2];
        if (root.items[MAJOR]) {
            const a = root.items[MAJOR];
            if (a.items[MINOR]) {
                const b = a.items[MINOR];
                if (b.max < PATCH)
                    return true;
            }
            else {
                if (a.max < MINOR)
                    return true;
            }
        }
        else {
            if (root.max < MAJOR)
                return true;
        }
    }
    async getVersionsByPid(pid, ...args) {
        return await this.ctx.dbo.version.findAll({
            attributes: args.length > 0 ? args : ['name'],
            where: { pid }
        });
    }
    async getVersionByPidAndName(pid, name, ...args) {
        return await this.ctx.dbo.version.findOne({
            attributes: args.length > 0 ? args : ['id'],
            where: { pid, name }
        });
    }
    async createNewVersion(options) {
        return await this.ctx.dbo.version.create(options);
    }
    async getSingleVersionByRev(rev, ...attributes) {
        const res = await this.ctx.dbo.version.findAll({
            attributes: attributes.length > 0 ? attributes : ['id'],
            where: { rev }
        });
        if (!res.length)
            return;
        return res[0];
    }
    async updateVersion(id, data) {
        return await this.ctx.dbo.version.update(data, {
            where: {
                id
            }
        });
    }
    async update(pid, version) {
        const one = await this.ctx.dbo.version.findOne({
            attributes: ['id', 'package'],
            where: {
                pid,
                name: version.version
            }
        });
        if (!one)
            return 0;
        const pkg = JSON.parse(one.package);
        const condition = pkg.deprecated !== version.deprecated;
        if (condition) {
            await this.ctx.dbo.version.update({
                package: JSON.stringify(version),
                mtime: new Date()
            }, {
                where: {
                    id: one.id
                }
            });
            return 1;
        }
        return 0;
    }
    async deleteVersion(vid) {
        return await this.ctx.dbo.version.destroy({
            where: { id: vid }
        });
    }
    async getCountOfPid(pid) {
        return await this.ctx.dbo.version.count({
            where: {
                pid
            }
        });
    }
}
__decorate([
    orm_1.Cacheable('/package/:pid(\\d+)/versions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], VersionService.prototype, "getVersionCache", null);
exports.default = VersionService;
