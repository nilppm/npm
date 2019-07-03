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
        async getPackageDistTagsWithScope(ctx) {
            const service = new this.service.TagService(ctx);
            ctx.body = await service.getDistTags(ctx.pkg);
        }
        async getPackageDistTagsWithScopeAndPkgname(ctx) {
            const service = new this.service.TagService(ctx);
            ctx.body = await service.getDistTags(ctx.pkg);
        }
        async putPackageDistTagsWithScope(ctx) {
            const service = new this.service.TagService(ctx);
            ctx.body = await service.putDistTags(ctx.pkg, ctx.params.tag, ctx.request.body);
        }
        async putPackageDistTagsWithScopeAndPkgname(ctx) {
            const service = new this.service.TagService(ctx);
            ctx.body = await service.putDistTags(ctx.pkg, ctx.params.tag, ctx.request.body);
        }
        async deletePackageDistTagsWithScope(ctx) {
            const service = new this.service.TagService(ctx);
            ctx.body = await service.deleteDistTags(ctx.pkg, ctx.params.tag);
        }
        async deletePackageDistTagsWithScopeAndPkgname(ctx) {
            const service = new this.service.PackageService(ctx);
            ctx.body = await service.unPublish(ctx.pkg.pathname, ctx.params.tag, ctx.account);
        }
    };
    __decorate([
        Controller.Get('/@:scope/dist-tags'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScope),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "getPackageDistTagsWithScope", null);
    __decorate([
        Controller.Get('/@:scope/:pkgname/dist-tags'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "getPackageDistTagsWithScopeAndPkgname", null);
    __decorate([
        Controller.Put('/@:scope/dist-tags/:tag'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScope),
        Controller.Request.Dynamic.Loader(nelts_1.Extra.Body({ istext: true })),
        Controller.Middleware(app.middleware.UserLoginMiddleware),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "putPackageDistTagsWithScope", null);
    __decorate([
        Controller.Put('/@:scope/:pkgname/dist-tags/:tag'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname),
        Controller.Request.Dynamic.Loader(nelts_1.Extra.Body({ istext: true })),
        Controller.Middleware(app.middleware.UserLoginMiddleware),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "putPackageDistTagsWithScopeAndPkgname", null);
    __decorate([
        Controller.Delete('/@:scope/dist-tags/:tag'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScope),
        Controller.Middleware(app.middleware.UserLoginMiddleware),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "deletePackageDistTagsWithScope", null);
    __decorate([
        Controller.Delete('/@:scope/:pkgname/dist-tags/:tag'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname),
        Controller.Middleware(app.middleware.UserLoginMiddleware),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "deletePackageDistTagsWithScopeAndPkgname", null);
    IndexController = __decorate([
        Controller.Prefix('/-/package'),
        __metadata("design:paramtypes", [nelts_1.WorkerPlugin])
    ], IndexController);
    return IndexController;
});
