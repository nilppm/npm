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
class TagService extends nelts_1.Component.Service {
    constructor(ctx) {
        super(ctx);
        this.configs = ctx.app.configs;
    }
    async getTagsCache(pid) {
        const result = await this.getVidAndNameByPid(pid);
        const res = {};
        result.forEach(ret => res[ret.name] = ret.vid);
        return res;
    }
    async getChunksByPidAndName(pid, name) {
        return await this.ctx.dbo.tag.findAll({
            attributes: ['vid'],
            where: {
                pid, name
            }
        });
    }
    async createNewTag(pid, name, vid) {
        const result = await this.ctx.dbo.tag.findOne({
            attributes: ['id'],
            where: {
                pid,
                name
            }
        });
        if (!result)
            return await this.ctx.dbo.tag.create({
                name, pid, vid
            });
        return await this.ctx.dbo.tag.update({ vid }, {
            where: {
                id: result.id
            }
        });
    }
    async deleteTag(pid, name) {
        const result = await this.ctx.dbo.tag.findOne({
            attributes: ['id'],
            where: {
                pid,
                name
            }
        });
        if (result) {
            await this.ctx.dbo.tag.destroy({
                where: {
                    id: result.id
                }
            });
        }
    }
    async getVidAndNameByPid(pid) {
        return await this.ctx.dbo.tag.findAll({
            attributes: ['vid', 'name'],
            where: { pid }
        });
    }
    async updateVidOnNamesByPid(pid, vid, names) {
        return await this.ctx.dbo.tag.update({
            vid
        }, {
            where: {
                pid,
                name: {
                    [sequelize_1.Op.in]: names
                }
            }
        });
    }
    async removeAllByPid(pid) {
        return await this.ctx.dbo.tag.destroy({
            where: { pid }
        });
    }
    async getDistTags(pkg) {
        const PackageService = new this.service.PackageService(this.ctx);
        const result = await PackageService.getPackageInfo(pkg);
        if (!result)
            throw new Error('cannot find the package of ' + pkg.pathname);
        return result['dist-tags'];
    }
    async putDistTags(pkg, tag, body) {
        if (!body)
            throw new Error('add dist-tag need a body of version');
        if (!body.startsWith('"'))
            throw new Error('add dist-tag need a body of start with `"`');
        body = JSON.parse(body);
        if (!/^\d+\.\d+\.\d+$/.test(body))
            throw new Error('add dist-tag: body is not a version');
        const PackageService = new this.service.PackageService(this.ctx);
        const VersionService = new this.service.VersionService(this.ctx);
        const MaintainerService = new this.service.MaintainerService(this.ctx);
        const pack = await PackageService.getSinglePackageByPathname(pkg.pathname);
        if (!pack)
            throw new Error('cannot find the package of ' + pkg.pathname);
        const maintainers = await MaintainerService.getMaintainersByPid(pack.id);
        if (!MaintainerService.checkMaintainerAllow(this.ctx.account, maintainers))
            throw new Error('you cannot use add dist-tag on this package: ' + pkg.pathname);
        const version = await VersionService.getVersionByPidAndName(pack.id, body);
        if (!version)
            throw new Error(`cannot find the version<${body}> in package<${pkg.pathname}> versions data.`);
        await this.createNewTag(pack.id, tag, version.id);
        await PackageService.updatePackageCache(pack.id);
    }
    async deleteDistTags(pkg, tag) {
        if (tag === 'latest')
            throw new Error('you cannot delete the dist-tag name of latest');
        const PackageService = new this.service.PackageService(this.ctx);
        const MaintainerService = new this.service.MaintainerService(this.ctx);
        const pack = await PackageService.getSinglePackageByPathname(pkg.pathname);
        if (!pack)
            throw new Error('cannot find the package of ' + pkg.pathname);
        const maintainers = await MaintainerService.getMaintainersByPid(pack.id);
        if (!MaintainerService.checkMaintainerAllow(this.ctx.account, maintainers))
            throw new Error('you cannot use rm dist-tag on this package: ' + pkg.pathname);
        await this.deleteTag(pack.id, tag);
        await PackageService.updatePackageCache(pack.id);
    }
}
__decorate([
    orm_1.Cacheable('/package/:pid(\\d+)/tags'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TagService.prototype, "getTagsCache", null);
exports.default = TagService;
