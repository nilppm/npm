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
const request = require("request");
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
    async getGithubCounts(ctx) {
        const body = ctx.request.body;
        ctx.body = await new Promise((resolve, reject) => {
            const url = 'https://api.github.com/repos/' + body.pathname;
            request.get(url, (err, response, body) => {
                if (err)
                    return reject(err);
                if (response.statusCode >= 300 || response.statusCode < 200)
                    return reject(new Error(response.statusMessage));
                resolve(body);
            });
        });
        ctx.type = 'json';
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
__decorate([
    Controller.Post('/package/github/repo/metadata'),
    Controller.Request.Dynamic.Loader(nelts_1.Extra.Body({ isapi: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebController.prototype, "getGithubCounts", null);
WebController = __decorate([
    Controller.Prefix('/api'),
    __metadata("design:paramtypes", [nelts_1.WorkerPlugin])
], WebController);
exports.default = WebController;
