import { NPMContext } from '../index';
import { Component, NELTS_CONFIGS } from '@nelts/nelts';
import { Cacheable, CacheableInterface } from '@nelts/orm';

export interface UserInfo {
  account: string,
  name: string,
  email: string,
  avatar: string,
  scopes: string[],
  extra: {
    [name: string]: any
  }
}

export type AddUserRequestData = { 
  _id: string,
  name: string,
  password: string,
  type: string,
  roles: string[],
  date: string,
};

interface AddUserResponseData {
  ok: boolean,
  id: string,
  rev: string,
}

export default class UserService extends Component.Service<NPMContext> {
  private configs: NELTS_CONFIGS;
  constructor(ctx: NPMContext) {
    super(ctx);
    this.configs = ctx.app.configs;
  }

  @Cacheable('/user/info/:account')
  async userCache(account: string): Promise<any> {
    const users: object[] = await this.ctx.dbo.user.findAll({
      where: {
        account
      }
    });
    if (users.length) {
      const userinfo: any = (<{dataValues: any}>users[0]).dataValues;
      userinfo.scopes = JSON.parse(userinfo.scopes);
      userinfo.extra = JSON.parse(userinfo.extra);
      const result: UserInfo = userinfo;
      return result;
    }
  }

  async showUser(account: string) {
    const cache: CacheableInterface = await this.userCache(account);
    let user = await cache.get({ account });
    if (!user) {
      const userinfo = typeof this.configs.getUserInfo === 'function' ? await this.configs.getUserInfo(account) : {
        account,
        name: account,
        email: this.configs.defaultEmailSuffix ? account + this.configs.defaultEmailSuffix : null,
        avatar: 'https://i.loli.net/2017/08/21/599a521472424.jpg',
        scopes: ['@' + account],
        extra: {}
      };
      await this.ctx.dbo.user.create({
        account: userinfo.account,
        name: userinfo.name,
        email: userinfo.email,
        avatar: userinfo.avatar,
        scopes: JSON.stringify(userinfo.scopes),
        extra: JSON.stringify(userinfo.extra),
      });
      user = await cache.set({ account });
    }
    if (!user) throw new Error('Cannot find user:' + account);
    return {
      _id: 'org.couchdb.user:' + user.account,
      name: user.name,
      email: user.email,
      type: 'user',
      avatar: user.avatar,
      scopes: user.scopes,
      extra: user.extra,
    };
  }

  async getUserByAccount(account: string) {
    return await this.ctx.dbo.user.findAll({
      attributes: ['id'],
      where: {
        account
      }
    })
  }

  async updateUserByAccount(data: {[name: string]: any}, account: string) {
    return await this.ctx.dbo.user.update(data, {
      where: {
        account
      }
    });
  }

  async createUser(data: {[name: string]: any}) {
    return await this.ctx.dbo.user.create(data);
  }

  async addUser(data: AddUserRequestData): Promise<AddUserResponseData> {
    let userinfo: UserInfo;
    const rev = Buffer.from(data.name + ':' + data.password, 'utf8').toString('base64');

    if (typeof this.configs.userLogin !== 'function') {
      userinfo = {
        account: data.name,
        name: data.name,
        email: this.configs.defaultEmailSuffix ? data.name + this.configs.defaultEmailSuffix : null,
        avatar: 'https://i.loli.net/2017/08/21/599a521472424.jpg',
        scopes: ['@' + data.name],
        extra: {}
      }
    } else {
      userinfo = await this.configs.userLogin(data.name, data.password, new Date(data.date));
    }

    if (Array.isArray(this.configs.scopes)) {
      this.configs.scopes.forEach(scope => {
        if (!scope.startsWith('@')) return;
        const index = userinfo.scopes.indexOf(scope);
        if (index === -1) userinfo.scopes.push(scope);
      });
    }

    const findResults = await this.getUserByAccount(userinfo.account).catch(console.log);

    if (findResults && findResults.length) {
      await this.updateUserByAccount({
        name: userinfo.name,
        email: userinfo.email,
        avatar: userinfo.avatar,
        scopes: JSON.stringify(userinfo.scopes),
        extra: JSON.stringify(userinfo.extra),
        mtime: new Date(data.date),
      }, userinfo.account);
    } else {
      await this.createUser({
        account: userinfo.account,
        name: userinfo.name,
        email: userinfo.email,
        avatar: userinfo.avatar,
        scopes: JSON.stringify(userinfo.scopes),
        extra: JSON.stringify(userinfo.extra),
        ctime: new Date(data.date),
      });
    }

    const cache: CacheableInterface = await this.userCache(userinfo.account);
    await cache.set({ account: userinfo.account });
    await this.ctx.redis.set(':user:expire:' + rev, userinfo.account, this.configs.loginExpire);

    return {
      ok: true,
      id: 'org.couchdb.user:' + userinfo.account,
      rev
    }
  }
}