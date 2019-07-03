"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const nelts_1 = require("@nelts/nelts");
const NILPPM_PATH = path.resolve(process.cwd(), 'nilppm.config.js');
let NILPPM_CONFIGS = {};
if (fs.existsSync(NILPPM_PATH)) {
    NILPPM_CONFIGS = nelts_1.Require(NILPPM_PATH);
    NILPPM_CONFIGS.nfs = process.cwd();
}
exports.default = Object.assign({
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
}, NILPPM_CONFIGS);
