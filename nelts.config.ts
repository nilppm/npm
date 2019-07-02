import * as path from 'path';
export default {
  cookie: ['nelts', 'cookie'],
  sequelize: {
    database: 'cpm',
    username: 'shenyj',
    password: '!2!34ffh!rfRg89_',
    options: {
      dialect: 'mysql',
      host: '192.168.2.181',
      pool: {
        max: 10,
        min: 3
      }
    }
  },
  redis: '192.168.2.208:6379',
  redis_prefix: 'nilppm:npm',
  loginExpire: 3 * 24 * 60 * 60,
  officialNpmRegistry: 'https://registry.npmjs.com',
  officialNpmReplicate: 'https://replicate.npmjs.com',
  sourceNpmRegistry: 'https://registry.npm.taobao.org',
  registryHost: 'http://127.0.0.1:8080',
  nfs: path.resolve(process.env.HOME, 'cpm', 'packages'),
  fetchPackageRegistriesOrder: [
    'sourceNpmRegistry', 
    'officialNpmRegistry', 
    'officialNpmReplicate'
  ],
  scopes: ['@html5', '@node'],
  defaultEmailSuffix: '@example.com',
  admins: [],
  // login(account: string, password: string, date: Date) {

  // }
}