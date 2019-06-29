import { Component, Context, NELTS_CONFIGS } from '@nelts/nelts';
import { Cacheable, CacheableInterface, getSequelizeFieldValues } from '@nelts/orm';

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

export default class UserService extends Component.Service {
  private configs: NELTS_CONFIGS;
  constructor(ctx: Context) {
    super(ctx);
    this.configs = ctx.app.configs;
  }

  @Cacheable('/user/info/:account')
  async userCache(account: string): Promise<any> {
    const users: object[] = getSequelizeFieldValues(await this.ctx.sequelize.cpm.user.findAll({
      where: {
        account
      }
    }));
    if (users.length) {
      const userinfo: any = users[0];
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
      if (typeof this.configs.user !== 'function') throw new Error('please set user fetching function first.');
      const userinfo = await this.configs.user(account);
      await this.ctx.sequelize.cpm.user.create({
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

  async addUser(data: AddUserRequestData): Promise<AddUserResponseData> {
    let userinfo: UserInfo;
    const rev = Buffer.from(data.name + ':' + data.password, 'utf8').toString('base64');

    if (typeof this.configs.login !== 'function') {
      userinfo = {
        account: data.name,
        name: data.name,
        email: this.configs.defaultEmailSuffix ? data.name + this.configs.defaultEmailSuffix : null,
        avatar: 'https://i.loli.net/2017/08/21/599a521472424.jpg',
        scopes: ['@' + data.name],
        extra: {}
      }
    } else {
      userinfo = await this.configs.login(data.name, data.password, new Date(data.date));
    }

    if (Array.isArray(this.configs.scopes)) {
      this.configs.scopes.forEach(scope => {
        if (!scope.startsWith('@')) return;
        const index = userinfo.scopes.indexOf(scope);
        if (index === -1) userinfo.scopes.push(scope);
      });
    }

    const findResults = await this.ctx.sequelize.cpm.user.findAll({
      attributes: ['id'],
      where: {
        account: userinfo.account
      }
    });

    if (findResults.length) {
      await this.ctx.sequelize.cpm.user.update({
        name: userinfo.name,
        email: userinfo.email,
        avatar: userinfo.avatar,
        scopes: JSON.stringify(userinfo.scopes),
        extra: JSON.stringify(userinfo.extra),
        mtime: new Date(data.date),
      }, {
        where: {
          account: userinfo.account
        }
      });
    } else {
      await this.ctx.sequelize.cpm.user.create({
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