"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nelts_1 = require("@nelts/nelts");
const gravatar_1 = require("gravatar");
class WebService extends nelts_1.Component.Service {
    constructor(ctx) {
        super(ctx);
        this.configs = ctx.app.configs;
    }
    async getPackage(pathname, version) {
        const PackageService = new this.service.PackageService(this.ctx);
        const result = await PackageService.getPackageInfo({ pathname, version });
        this.fixRepo(result);
        await this.fixUser(result);
        return result;
    }
    fixRepo(result) {
        const repository = result.repository;
        if (!repository || (repository.type && repository.type !== 'git'))
            return;
        let { url } = repository;
        if (url.startsWith('git+'))
            url = url.slice('git+'.length);
        if (url.endsWith('.git'))
            url = url.slice(0, -'.git'.length);
        if (url.startsWith('git://'))
            url = url.slice('git://'.length);
        if (url.startsWith('ssh://'))
            url = url.slice('ssh://'.length);
        if (url.startsWith('git@github.com:'))
            url = `github.com/${url.slice('git@github.com:'.length)}`;
        if (url.startsWith('git@github.com/'))
            url = `github.com/${url.slice('git@github.com/'.length)}`;
        if (!url.startsWith('https://'))
            url = `https://${url}`;
        const exec = /http(s)?:\/\/([^\/]+)/.exec(url);
        result._repository = {
            url,
            type: 'gitlab'
        };
        if (exec) {
            const host = exec[2].toLowerCase();
            if (host.split('.').slice(-2)[0] === 'github') {
                result._repository.type = 'github';
            }
        }
    }
    async fixUser(result) {
        if (result.author) {
            if (typeof result.author === 'string') {
                result.author = { name: result.author };
            }
            if (!result.author.email && result.maintainers && result.maintainers.length) {
                for (let i = 0; i < result.maintainers.length; i++) {
                    if (result.maintainers[i].name === result.author.name) {
                        result.author.email = result.maintainers[i].email;
                        break;
                    }
                }
            }
            result.author = await this.formatUserAvatar(result.author);
        }
        if (result.maintainers && result.maintainers.length) {
            result.maintainers = await Promise.all(result.maintainers.map((maintainer) => this.formatUserAvatar(maintainer)));
        }
    }
    async formatUserAvatar(user) {
        const UserService = new this.service.UserService(this.ctx);
        const _user = await UserService.userCache(user.name).get({ account: user.name });
        if (_user) {
            if (_user.email === user.email)
                return {
                    name: _user.account,
                    email: _user.email,
                    avatar: _user.avatar,
                    nick: _user.name,
                };
        }
        return {
            name: user.name,
            email: user.email,
            avatar: gravatar_1.url(user.email),
            nick: user.name,
        };
    }
}
exports.default = WebService;
