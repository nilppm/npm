import { NPMContext, NPMWorkerPlugin } from '../index';
import { Component, NELTS_CONFIGS, LRU } from '@nelts/nelts';
import { url } from 'gravatar';
import * as request from 'request';
import * as cheerio from 'cheerio';
const lru = new LRU(300);
const NpmApi = require('npm-api');
const npm = new NpmApi();

export default class WebService extends Component.Service<NPMWorkerPlugin, NPMContext> {
  private configs: NELTS_CONFIGS;
  constructor(ctx: NPMContext) {
    super(ctx);
    this.configs = ctx.app.configs;
  }

  async getPackage(pathname: string, version?: string) {
    const PackageService = new this.service.PackageService(this.ctx);
    const result = await PackageService.getPackageInfo({ pathname, version });
    this.fixRepo(result);
    await this.fixUser(result);
    const properties: Promise<any>[] = [];
    result._downloads = {};
    if (!result._nilppm) {
      const repo = npm.repo(pathname);
      if (!result.readme) properties.push(this.fixReadme(pathname, result.version).then(data => result.readme = data));
      if (!result.dependencies) properties.push(repo.dependencies(result.version).then((data: any) => result.dependencies = data));
      if (!result.devDependencies) properties.push(repo.devDependencies(result.version).then((data: any) => result.devDependencies = data));
      if (result['dist-tags'].latest === result.version) this.fixStatisticsFromNpm(pathname, properties, result);
    } else {
      if (result['dist-tags'].latest === result.version) {
        this.fixStatisticsFromDBO(pathname, properties, result);
      }
    }
    await Promise.all(properties);
    return result;
  }

  fixStatisticsFromDBO(pathname: string, properties: Promise<any>[], result: any) {
    const StatisticsService = new this.service.StatisticsService(this.ctx);
    // properties.push(StatisticsService.Week(pathname).then((data: any) => result._downloads.week = data));
    properties.push(StatisticsService.Month(pathname).then((data: any) => result._downloads.month = data));
  }

  fixStatisticsFromNpm(pathname: string, properties: Promise<any>[], result: any) {
    // properties.push(this.getNpmDownloadsApi('https://api.npmjs.org/downloads/range/last-week/' + pathname).then((data: string) => {
    //   const _data = JSON.parse(data);
    //   if (_data.error) return Promise.reject(new Error(_data.error));
    //   result._downloads.week = _data.downloads;
    //   console.log(result._downloads.week)
    // }))
    properties.push(this.getNpmDownloadsApi('https://api.npmjs.org/downloads/range/last-month/' + pathname).then((data: string) => {
      const _data = JSON.parse(data);
      if (_data.error) return Promise.reject(new Error(_data.error));
      result._downloads.month = _data.downloads;
    }))
  }

  async getNpmDownloadsApi(url: string) {
    return await new Promise((resolve, reject) => {
      request.get(url, (err: Error, response: request.Response, body: string) => {
        if (err) return reject(err);
        if (response.statusCode >= 300 || response.statusCode < 200) return reject(new Error(response.statusMessage));
        resolve(body);
      });
    });
  }

  fixRepo(result: any) {
    const repository = result.repository;
    if (!repository || (repository.type && repository.type !== 'git')) return;
    let { url } = repository;
    if (url.startsWith('git+')) url = url.slice('git+'.length);
    if (url.endsWith('.git')) url = url.slice(0, -'.git'.length);
    if (url.startsWith('git://')) url = url.slice('git://'.length);
    if (url.startsWith('ssh://')) url = url.slice('ssh://'.length);
    if (url.startsWith('git@github.com:')) url = `github.com/${url.slice('git@github.com:'.length)}`;
    if (url.startsWith('git@github.com/')) url = `github.com/${url.slice('git@github.com/'.length)}`;
    // finally add the correct protocol
    if (!url.startsWith('https://')) url = `https://${url}`;
    const exec = /http(s)?:\/\/([^\/]+)/.exec(url);
    result._repository = {
      url,
      type: 'gitlab'
    }
    if (exec) {
      const host = exec[2].toLowerCase();
      if (host.split('.').slice(-2)[0] === 'github') {
        result._repository.type = 'github';
      }
    }
  }

  async fixUser(result: any) {
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
      result.maintainers = await Promise.all(result.maintainers.map((maintainer: { name: string, email: string }) => this.formatUserAvatar(maintainer)));
    }
  }

  fixRemoteMaintainers(result: any) {
    if (result.maintainers && result.maintainers.length) {
      result.maintainers = result.maintainers.map((maintainer: { username: string, email: string }) => {
        return {
          name: maintainer.username,
          email: maintainer.email,
          avatar: url(maintainer.email),
          nick: maintainer.username,
        }
      });
    }
  }

  async formatUserAvatar(user?: { name: string, email?: string }): Promise<{ name: string, email: string, avatar: string, nick: string }> {
    if (!user || !user.name) {
      return {
        name: 'unknow',
        email: 'unknow@blank.com',
        avatar: url('unknow@blank.com'),
        nick: 'unknow',
      }
    }
    const UserService = new this.service.UserService(this.ctx);
    const _user = await UserService.userCache(user.name).get({ account: user.name });
    if (_user) {
      if (_user.email === user.email) return {
        name: _user.account,
        email: _user.email,
        avatar: _user.avatar,
        nick: _user.name,
      }
    }
    return {
      name: user.name,
      email: user.email,
      avatar: url(user.email),
      nick: user.name,
    }
  }

  async fixReadme(pathname: string, version: string) {
    const key = `${pathname}:${version}`;
    const content = lru.get(key);
    if (content) return content;
    let url = `https://www.npmjs.com/package/${pathname}`;
    if (version) url += '/v/' + version;
    const html: any = await this.getNpmDownloadsApi(url);
    const readme = cheerio.load(html)('#readme').html();
    lru.set(key, readme);
    return readme;
  }
}