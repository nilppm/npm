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
    let UserController = class UserController extends nelts_1.Component.Controller {
        constructor(app) {
            super(app);
        }
        async getUser(ctx) {
            const service = new this.service.UserService(ctx);
            ctx.body = await service.showUser(ctx.params.account.substring(1));
            ctx.status = 201;
        }
        async addUser(ctx) {
            const service = new this.service.UserService(ctx);
            ctx.body = await service.addUser(ctx.request.body);
            ctx.status = 201;
        }
    };
    __decorate([
        Controller.Get('/org.couchdb.user:account(^:.+$)'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], UserController.prototype, "getUser", null);
    __decorate([
        Controller.Put('/org.couchdb.user:account(^:.+$)'),
        Controller.Request.Dynamic.Loader(nelts_1.Extra.Body({ isapi: true })),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], UserController.prototype, "addUser", null);
    UserController = __decorate([
        Controller.Prefix('/-/user'),
        __metadata("design:paramtypes", [Object])
    ], UserController);
    return UserController;
});
