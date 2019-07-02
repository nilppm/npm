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
exports.default = nelts_1.Scope(app => {
    let IndexController = class IndexController extends nelts_1.Component.Controller {
        constructor(app) {
            super(app);
        }
        async GetPackageInformationWithScopePkgnameAndVersion(ctx) {
            const service = new this.service.PackageService(ctx);
            ctx.body = await service.getPackageInfo(ctx.pkg);
        }
        async GetPackageInformationWithScopeAndPkgname(ctx) {
            const service = new this.service.PackageService(ctx);
            ctx.body = await service.getPackageInfo(ctx.pkg);
        }
        async GetPackageInformationWithScope(ctx) {
            const service = new this.service.PackageService(ctx);
            ctx.body = await service.getPackageInfo(ctx.pkg);
        }
        async GetPackageInformationWithPkgnameAndVersion(ctx) {
            const service = new this.service.PackageService(ctx);
            ctx.body = await service.getPackageInfo(ctx.pkg);
        }
        async GetPackageInformationWithPkgname(ctx) {
            const service = new this.service.PackageService(ctx);
            ctx.body = await service.getPackageInfo(ctx.pkg);
        }
        async PrepareToLogin(ctx) {
            const v = Number(ctx.params.v);
            await ctx.app.root.broadcast('NpmPrepareLogin', ctx, v);
            ctx.status = 422;
        }
        async putPackageWithScope(ctx) {
            const service = new this.service.PackageService(ctx);
            await service.publish(ctx.account, ctx.request.body);
            ctx.body = {
                ok: true,
            };
        }
        async putPackageWithScopeAndPkgname(ctx) {
            const service = new this.service.PackageService(ctx);
            ctx.body = await service.publish(ctx.account, ctx.request.body);
        }
        async npmAddOwnerUserWithScope(ctx) {
            const service = new this.service.MaintainerService(ctx);
            await service.addOwner(ctx.params.rev, ctx.pkg.pathname, ctx.request.body.maintainers);
            ctx.body = {
                ok: true
            };
        }
        async npmAddOwnerUserWithScopeAndPkgname(ctx) {
            const service = new this.service.MaintainerService(ctx);
            await service.addOwner(ctx.params.rev, ctx.pkg.pathname, ctx.request.body.maintainers);
            ctx.body = {
                ok: true
            };
        }
    };
    __decorate([
        Controller.Get('/@:scope/:pkgname/:version'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScopePkgnameAndVersion),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "GetPackageInformationWithScopePkgnameAndVersion", null);
    __decorate([
        Controller.Get('/@:scope/:pkgname'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "GetPackageInformationWithScopeAndPkgname", null);
    __decorate([
        Controller.Get('/@:scope'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScope),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "GetPackageInformationWithScope", null);
    __decorate([
        Controller.Get('/:pkgname/:version'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithPkgnameAndVersion),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "GetPackageInformationWithPkgnameAndVersion", null);
    __decorate([
        Controller.Get('/:pkgname'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithPkgname),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "GetPackageInformationWithPkgname", null);
    __decorate([
        Controller.Post('/-/v:v(\\d+)/login'),
        Controller.Request.Dynamic.Loader(nelts_1.Extra.Body({ isapi: true })),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "PrepareToLogin", null);
    __decorate([
        Controller.Put('/@:scope'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScope),
        Controller.Request.Dynamic.Loader(nelts_1.Extra.Body({ isapi: true })),
        Controller.Middleware(app.middleware.UserLoginMiddleware),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "putPackageWithScope", null);
    __decorate([
        Controller.Put('/@:scope/:pkgname'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname),
        Controller.Request.Dynamic.Loader(nelts_1.Extra.Body({ isapi: true })),
        Controller.Middleware(app.middleware.UserLoginMiddleware),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "putPackageWithScopeAndPkgname", null);
    __decorate([
        Controller.Put('/@:scope/-rev/:rev'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScope),
        Controller.Request.Dynamic.Loader(nelts_1.Extra.Body({ isapi: true })),
        Controller.Middleware(app.middleware.UserLoginMiddleware),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "npmAddOwnerUserWithScope", null);
    __decorate([
        Controller.Put('/@:scope/:pkgname/-rev/:rev'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname),
        Controller.Request.Dynamic.Loader(nelts_1.Extra.Body({ isapi: true })),
        Controller.Middleware(app.middleware.UserLoginMiddleware),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "npmAddOwnerUserWithScopeAndPkgname", null);
    IndexController = __decorate([
        Controller.Prefix(),
        __metadata("design:paramtypes", [nelts_1.WorkerPlugin])
    ], IndexController);
    return IndexController;
});
