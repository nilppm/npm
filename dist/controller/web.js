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
const Controller = nelts_1.Decorator.Controller;
let WebController = class WebController extends nelts_1.Component.Controller {
    constructor(app) {
        super(app);
    }
    async getUserWithScopeAndPkgname(ctx) {
        const service = new this.service.WebService(ctx);
        ctx.body = await service.getPackage(`@${ctx.params.scope}/${ctx.params.pkgname}`);
    }
    async getUserWithPkgname(ctx) {
        const service = new this.service.WebService(ctx);
        ctx.body = await service.getPackage(ctx.params.pkgname);
    }
    async getUserWithScopeAndPkgnameUseVersion(ctx) {
        const service = new this.service.WebService(ctx);
        ctx.body = await service.getPackage(`@${ctx.params.scope}/${ctx.params.pkgname}`, ctx.params.version);
    }
    async getUserWithPkgnameUseVersion(ctx) {
        const service = new this.service.WebService(ctx);
        ctx.body = await service.getPackage(ctx.params.pkgname, ctx.params.version);
    }
};
__decorate([
    Controller.Get('/package/@:scope/:pkgname'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebController.prototype, "getUserWithScopeAndPkgname", null);
__decorate([
    Controller.Get('/package/:pkgname'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebController.prototype, "getUserWithPkgname", null);
__decorate([
    Controller.Get('/package/@:scope/:pkgname/v/:version'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebController.prototype, "getUserWithScopeAndPkgnameUseVersion", null);
__decorate([
    Controller.Get('/package/:pkgname/v/:version'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebController.prototype, "getUserWithPkgnameUseVersion", null);
WebController = __decorate([
    Controller.Prefix('/api'),
    __metadata("design:paramtypes", [nelts_1.WorkerPlugin])
], WebController);
exports.default = WebController;
