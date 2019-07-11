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
const fs = require("fs");
const path = require("path");
const os = require("os");
const total_1 = require("../lib/total");
const nelts_1 = require("@nelts/nelts");
const Controller = nelts_1.Decorator.Controller;
let CPM_CACHE = {};
let CPM_TIME = 0;
exports.default = nelts_1.Scope(app => {
    let IndexController = class IndexController extends nelts_1.Component.Controller {
        constructor(app) {
            super(app);
        }
        async metadata(ctx) {
            let pkgfile = path.resolve(__dirname, '../package.json');
            if (!fs.existsSync(pkgfile))
                pkgfile = path.resolve(__dirname, '../../package.json');
            const project = require(pkgfile);
            if (Date.now() - CPM_TIME > 10 * 60 * 1000) {
                CPM_CACHE = await total_1.default(ctx);
                CPM_TIME = Date.now();
            }
            CPM_CACHE.version = project.version;
            CPM_CACHE.description = project.description;
            CPM_CACHE.machine = {
                cpu: {
                    arch: os.arch(),
                    info: os.cpus()
                },
                freemem: os.freemem(),
                hostname: os.hostname(),
                networkInterfaces: os.networkInterfaces(),
                platform: os.platform(),
                release: os.release(),
                totalmem: os.totalmem(),
                type: os.type(),
                uptime: os.uptime(),
                loadavg: os.loadavg()
            };
            ctx.body = CPM_CACHE;
        }
        async download(ctx) {
            const file = path.resolve(app.configs.nfs, ctx.pkg.pathname);
            if (!file.endsWith('.tgz'))
                throw new Error('invaild package suffix extion.');
            if (!fs.existsSync(file)) {
                const err = new Error('cannot find the package');
                err.status = 404;
                throw err;
            }
            if (ctx.app.configs.statistics) {
                const i = ctx.pkg.pathname.lastIndexOf('-');
                const str = ctx.pkg.pathname.substring(i + 1);
                const pathname = ctx.pkg.pathname.substring(0, i);
                const j = str.lastIndexOf('.tgz');
                const version = str.substring(0, j);
                if (/^\d+\.\d+\.\d+$/.test(version)) {
                    ctx.dbo.statistics.create({
                        pathname,
                        version,
                    });
                }
            }
            ctx.body = fs.createReadStream(file);
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
            if (ctx.request.body._attachments) {
                await service.publish(ctx.account, ctx.request.body);
            }
            else {
                await service.updatPackage(ctx.request.body);
            }
            ctx.body = { ok: true };
        }
        async putPackageWithScopeAndPkgname(ctx) {
            const pkg = ctx.request.body;
            const version = pkg.version;
            const service = new this.service.PackageService(ctx);
            if (pkg._attachments) {
                await service.publish(ctx.account, ctx.request.body);
            }
            else if (pkg.versions && pkg.versions[version].deprecated) {
                await service.deprecate(pkg.name, version, pkg.versions[version].deprecated);
            }
            ctx.body = { ok: true };
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
        async unPublishWithLocal(ctx) {
            const service = new this.service.PackageService(ctx);
            ctx.body = await service.unPublish(ctx.pkg.pathname, ctx.params.rev);
        }
        async unPublishWithScope(ctx) {
            const service = new this.service.PackageService(ctx);
            ctx.body = await service.unPublish(ctx.pkg.pathname, ctx.params.rev);
        }
        async unPublishWithScopeAndName(ctx) {
            const service = new this.service.PackageService(ctx);
            ctx.body = await service.unPublish(ctx.pkg.pathname, ctx.params.rev);
        }
    };
    __decorate([
        Controller.Get('/metadata'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "metadata", null);
    __decorate([
        Controller.Get('/download/@:scope/:pkgname'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "download", null);
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
    __decorate([
        Controller.Delete('/download/@:scope/:pkgname/-rev/:rev'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname),
        Controller.Middleware(app.middleware.UserLoginMiddleware),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "unPublishWithLocal", null);
    __decorate([
        Controller.Delete('/@:scope/-rev/:rev'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScope),
        Controller.Middleware(app.middleware.UserLoginMiddleware),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "unPublishWithScope", null);
    __decorate([
        Controller.Delete('/@:scope/:pkgname/-rev/:rev'),
        Controller.Request.Static.Filter(app.middleware.decodePackageWithScopeAndPkgname),
        Controller.Middleware(app.middleware.UserLoginMiddleware),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], IndexController.prototype, "unPublishWithScopeAndName", null);
    IndexController = __decorate([
        Controller.Prefix(),
        __metadata("design:paramtypes", [nelts_1.WorkerPlugin])
    ], IndexController);
    return IndexController;
});
