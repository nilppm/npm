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
const intersect_1 = require("../lib/intersect");
class MaintainerService extends nelts_1.Component.Service {
    constructor(ctx) {
        super(ctx);
        this.configs = ctx.app.configs;
    }
    async removeAllByPid(pid) {
        return await this.ctx.dbo.maintainer.destroy({
            where: { pid }
        });
    }
    async getMaintainersCache(pid) {
        const result = await this.getMaintainersByPid(pid);
        return result.map(res => res.account);
    }
    checkMaintainerAllow(account, maintainers) {
        if (!account)
            throw new Error('you must login first.');
        if (this.configs.admins) {
            const admins = Array.isArray(this.configs.admins) ? this.configs.admins : [this.configs.admins];
            if (admins.indexOf(account) > -1)
                return true;
        }
        for (let i = 0; i < maintainers.length; i++) {
            const maintainer = maintainers[i];
            if ((maintainer.name || maintainer.account) === account)
                return true;
        }
    }
    async addOwner(rev, pathname, maintainers) {
        const PackageService = new this.service.PackageService(this.ctx);
        const VersionService = new this.service.VersionService(this.ctx);
        const pack = await PackageService.getSinglePackageByPathname(pathname);
        const ver = await VersionService.getSingleVersionByRev(rev, 'id', 'package');
        if (!pack)
            throw new Error('cannot find package: ' + pathname);
        if (!ver)
            throw new Error('cannot find verion<rev> of package: ' + pathname + ': ' + rev);
        const databaseMaintainers = await this.getMaintainersByPid(pack.id);
        if (!this.checkMaintainerAllow(this.ctx.account, databaseMaintainers.map(user => {
            return {
                name: user.account,
            };
        })))
            throw new Error('you have no right to use `add owner` commander');
        const oldMaintainers = databaseMaintainers.map(user => user.account);
        const newMaintainers = maintainers.map(user => user.name);
        ver.package = ver.package.indexOf('%7B%22') === 0 ? JSON.parse(decodeURIComponent(ver.package)) : JSON.parse(ver.package);
        ver.package.maintainers = maintainers;
        const diff = intersect_1.default(oldMaintainers, newMaintainers);
        if (diff.adds.length)
            await Promise.all(diff.adds.map((account) => this.createNewMaintainer(account, pack.id)));
        if (diff.removes.length)
            await Promise.all(diff.removes.map((account) => this.deleteMaintainer(account, pack.id)));
        const cache = await this.getMaintainersCache(pack.id);
        await cache.set({ pid: pack.id });
        await VersionService.updateVersion(ver.id, { package: JSON.stringify(ver.package) });
        await VersionService.getVersionCache(pack.id).set({ pid: pack.id });
    }
    async getMaintainersByPid(pid) {
        return await this.ctx.dbo.maintainer.findAll({
            attributes: ['account'],
            where: { pid }
        });
    }
    async createNewMaintainer(account, pid) {
        return await this.ctx.dbo.maintainer.create({
            account, pid
        });
    }
    async deleteMaintainer(account, pid) {
        console.log('delete', account, pid);
        return await this.ctx.dbo.maintainer.destroy({
            where: {
                account,
                pid
            }
        });
    }
}
__decorate([
    orm_1.Cacheable('/package/:pid(\\d+)/maintainers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MaintainerService.prototype, "getMaintainersCache", null);
exports.default = MaintainerService;
