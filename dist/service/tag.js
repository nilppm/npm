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
        return await this.ctx.dbo.tag.create({
            name, pid, vid
        });
    }
    async getVidAndNameByPid(pid) {
        return await this.ctx.dbo.tag.findAll({
            attributes: ['vid', 'name'],
            where: { pid }
        });
    }
}
__decorate([
    orm_1.Cacheable('/package/:pid(\\d+)/tags'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TagService.prototype, "getTagsCache", null);
exports.default = TagService;
