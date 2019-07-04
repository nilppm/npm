"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nelts_1 = require("@nelts/nelts");
const request = require("request");
const path = require("path");
const crypto = require("crypto");
const uuid = require("uuid/v4");
const fse = require("fs-extra");
const fs = require("fs");
class PackageService extends nelts_1.Component.Service {
    constructor(ctx) {
        super(ctx);
        this.configs = ctx.app.configs;
    }
    async unPublish(filepath, rev) {
        const MaintainerService = new this.service.MaintainerService(this.ctx);
        const VersionService = new this.service.VersionService(this.ctx);
        const TagService = new this.service.TagService(this.ctx);
        const result = await VersionService.getSingleVersionByRev(rev, 'id', 'pid', 'name', 'package', 'ctime', 'tarball');
        if (!result)
            throw new Error('cannot find the rev of ' + rev);
        const pack = await this.getSinglePackageById(result.pid, 'id', 'pathname');
        if (!pack)
            throw new Error('cannot find the package of id: ' + result.pid);
        if (filepath.endsWith('.tgz')) {
            if (pack.pathname + '-' + result.name + '.tgz' !== filepath)
                throw new Error('invaild package receiver.');
        }
        const maintainers = await MaintainerService.getMaintainersByPid(pack.id);
        if (!MaintainerService.checkMaintainerAllow(this.ctx.account, maintainers))
            throw new Error('you cannot unpublish this package');
        await VersionService.deleteVersion(result.id);
        const count = await VersionService.getCountOfPid(pack.id);
        if (count === 0) {
            await this.clearPackage(pack.id);
            await this.removePackageCache(pack.id, pack.pathname);
        }
        else {
            const tags = await TagService.getVidAndNameByPid(pack.id);
            let pool = [];
            for (let i = 0; i < tags.length; i++) {
                if (tags[i].vid === result.id) {
                    pool.push(tags[i].name);
                }
            }
            if (pool.length) {
                const version = await VersionService.findLatestVersion(pack.id, new Date(result.ctime));
                if (version) {
                    await TagService.updateVidOnNamesByPid(pack.id, version.id, pool);
                }
            }
            await this.updateModifiedTime(pack.id);
            await this.updatePackageCache(pack.id);
        }
        const dfile = path.resolve(this.configs.nfs, result.tarball);
        if (fs.existsSync(dfile))
            fs.unlinkSync(dfile);
        return JSON.parse(result.package);
    }
    async clearPackage(pid) {
        const MaintainerService = new this.service.MaintainerService(this.ctx);
        const TagService = new this.service.TagService(this.ctx);
        const VersionService = new this.service.VersionService(this.ctx);
        await Promise.all([
            MaintainerService.removeAllByPid(pid),
            TagService.removeAllByPid(pid),
            VersionService.removeAllByPid(pid),
            this.removeAllByPid(pid)
        ]);
    }
    async removeAllByPid(pid) {
        return await this.ctx.dbo.package.destroy({
            where: { id: pid }
        });
    }
    async removePackageCache(pid, pathname) {
        const TagServer = new this.service.TagService(this.ctx);
        const VersionService = new this.service.VersionService(this.ctx);
        const MaintainerService = new this.service.MaintainerService(this.ctx);
        await MaintainerService.getMaintainersCache(pid).delete({ pid });
        await TagServer.getTagsCache(pid).delete({ pid });
        await VersionService.getVersionCache(pid).delete({ pid });
        await this.ctx.redis.delete(':package:' + pathname);
    }
    async updatePackageCache(pid) {
        const TagServer = new this.service.TagService(this.ctx);
        const VersionService = new this.service.VersionService(this.ctx);
        const MaintainerService = new this.service.MaintainerService(this.ctx);
        await MaintainerService.getMaintainersCache(pid).set({ pid });
        await TagServer.getTagsCache(pid).set({ pid });
        await VersionService.getVersionCache(pid).set({ pid });
        const pack = await this.ctx.dbo.package.findAll({
            attributes: ['pathname', 'ctime', 'mtime'],
            where: {
                id: pid
            }
        });
        const pathname = pack[0].pathname;
        const ctime = pack[0].ctime;
        const mtime = pack[0].mtime;
        await this.ctx.redis.set(':package:' + pathname, {
            id: pid,
            ctime, mtime
        });
    }
    async getUri(url, name, version) {
        return await new Promise((resolve, reject) => {
            url += '/' + name;
            if (version)
                url += '/' + version;
            request.get(url, (err, response, body) => {
                if (err)
                    return reject(err);
                if (response.statusCode >= 300 || response.statusCode < 200)
                    return reject(new Error(response.statusMessage));
                resolve(body);
            });
        });
    }
    async getRemotePackageInformation(pathname, version) {
        const fetchPackageRegistriesOrder = this.configs.fetchPackageRegistriesOrder;
        for (let i = 0; i < fetchPackageRegistriesOrder.length; i++) {
            const text = await this.getUri(this.configs[fetchPackageRegistriesOrder[i]], pathname, version);
            try {
                const result = JSON.parse(text);
                if (!result.error) {
                    if (!result.version) {
                        if (!version) {
                            result.version = result['dist-tags'].latest;
                        }
                        else {
                            if (/\d+\.\d+\.\d+/.test(version)) {
                                result.version = version;
                            }
                            else {
                                result.version = result['dist-tags'][version];
                            }
                        }
                    }
                    return result;
                }
            }
            catch (e) { }
        }
        throw new Error('not found');
    }
    async getLocalPackageByPid(pid, ctime, mtime, version) {
        const TagServer = new this.service.TagService(this.ctx);
        const VersionService = new this.service.VersionService(this.ctx);
        const MaintainerService = new this.service.MaintainerService(this.ctx);
        const UserService = new this.service.UserService(this.ctx);
        const [maintainers, tags, versions] = await Promise.all([
            MaintainerService.getMaintainersCache(pid).get({ pid }),
            TagServer.getTagsCache(pid).get({ pid }),
            VersionService.getVersionCache(pid).get({ pid })
        ]);
        if (!maintainers || !maintainers.length ||
            !tags || !tags.latest ||
            !versions || !Object.keys(versions).length)
            throw new Error('invaild cache data with package');
        let chunk;
        const distTags = {};
        const chunkVersions = {};
        const times = {};
        for (const i in tags)
            distTags[i] = versions[tags[i]].version;
        if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
            if (!distTags[version])
                throw new Error('cannot find tag in dist-tags:' + version);
            version = distTags[version];
        }
        let _currentVersion;
        if (!version) {
            if (!versions[tags.latest])
                throw new Error('cannot find the latest version');
            chunk = versions[tags.latest];
            _currentVersion = tags.latest;
        }
        else {
            for (const i in versions) {
                if (versions[i].version === version) {
                    chunk = versions[i];
                    _currentVersion = version;
                    break;
                }
            }
        }
        if (!chunk)
            throw new Error('invaild version data in cache');
        chunk = JSON.parse(JSON.stringify(chunk));
        if (!chunk.version)
            chunk.version = _currentVersion;
        chunk.maintainers = (await Promise.all(maintainers.map((maintainer) => UserService.userCache(maintainer).get({ account: maintainer })))).map((user) => {
            return {
                name: user.account,
                email: user.email,
            };
        });
        chunk['dist-tags'] = distTags;
        for (const i in versions) {
            times[versions[i].version] = versions[i]._created;
            chunkVersions[versions[i].version] = versions[i];
            if (chunkVersions[versions[i].version].readme)
                delete chunkVersions[versions[i].version].readme;
        }
        chunk._nilppm = true;
        chunk.versions = chunkVersions;
        chunk.time = times;
        chunk.time.created = ctime;
        chunk.time.modified = mtime;
        if (chunk.main)
            delete chunk.main;
        if (chunk._nodeVersion)
            delete chunk._nodeVersion;
        if (chunk._npmUser)
            delete chunk._npmUser;
        if (chunk._npmVersion)
            delete chunk._npmVersion;
        return chunk;
    }
    async getPackageInfo(pkg) {
        const pck = await this.ctx.redis.get(':package:' + pkg.pathname);
        if (pck) {
            return await this.getLocalPackageByPid(pck.id, new Date(pck.ctime), new Date(pck.mtime), pkg.version);
        }
        const sp = pkg.pathname.split('/');
        if (sp.length > 2)
            throw new Error('invaild package name');
        if (sp.length === 2) {
            const scope = sp[0];
            if (this.configs.scopes.indexOf(scope) > -1) {
                const pack = await this.getSinglePackageByPathname(pkg.pathname, 'ctime', 'mtime');
                if (pack) {
                    await this.updatePackageCache(pack.id);
                    return await this.getLocalPackageByPid(pack.id, pack.ctime, pack.mtime, pkg.version);
                }
            }
        }
        return await this.getRemotePackageInformation(pkg.pathname, pkg.version);
    }
    createShasumCode(tarballBuffer) {
        const shasum = crypto.createHash('sha1');
        shasum.update(tarballBuffer);
        return shasum.digest('hex');
    }
    splitPackagePathname(pathname) {
        const sp = pathname.split('/');
        return {
            scope: sp[0],
            alias: sp[1],
        };
    }
    async getSinglePackageByPathname(pathname, ...attributes) {
        const res = await this.ctx.dbo.package.findAll({
            attributes: attributes.length > 0 ? attributes : ['id'],
            where: { pathname }
        });
        if (!res.length)
            return;
        return res[0];
    }
    async getSinglePackageById(id, ...attributes) {
        const res = await this.ctx.dbo.package.findAll({
            attributes: attributes.length > 0 ? attributes : ['id'],
            where: { id }
        });
        if (!res.length)
            return;
        return res[0];
    }
    async createNewPackage(scope, name, pathname) {
        return await this.ctx.dbo.package.create({
            scope, name, pathname,
        });
    }
    async updatPackage(pkg) {
        const pathname = pkg.name;
        const versions = pkg.versions;
        const pack = await this.getSinglePackageByPathname(pathname);
        const VersionService = new this.service.VersionService(this.ctx);
        const MaintainerService = new this.service.MaintainerService(this.ctx);
        if (!pack)
            throw new Error('cannot find the package of ' + pathname);
        const maintainers = await MaintainerService.getMaintainersByPid(pack.id);
        if (!MaintainerService.checkMaintainerAllow(this.ctx.account, maintainers))
            throw new Error('you cannot update version metadata ' + pkg.name);
        const pid = pack.id;
        let updated = 0;
        for (const i in versions) {
            const version = versions[i];
            updated += await VersionService.update(pid, version);
        }
        if (updated) {
            await this.updateModifiedTime(pid);
            await this.updatePackageCache(pid);
        }
    }
    async publish(account, pkg) {
        const name = pkg.name;
        const filename = Object.keys(pkg._attachments)[0];
        const version = Object.keys(pkg.versions)[0];
        const distTags = pkg['dist-tags'] || {};
        const UserService = new this.service.UserService(this.ctx);
        const VersionService = new this.service.VersionService(this.ctx);
        const MaintainerService = new this.service.MaintainerService(this.ctx);
        const TagServer = new this.service.TagService(this.ctx);
        if (!/^\d+\.\d+\.\d+$/.test(version))
            throw new Error('version is not a vaild version rule: ' + version);
        const tarballPath = path.resolve(this.configs.nfs, filename);
        if (!MaintainerService.checkMaintainerAllow(account, pkg.maintainers)) {
            throw new Error('You cannot publish this package or tell admins to add right for you');
        }
        if (!Object.keys(distTags).length) {
            throw new Error('invalid: dist-tags should not be empty.');
        }
        const { scope, alias } = this.splitPackagePathname(name);
        const cache = await UserService.userCache(account);
        const user = await cache.get({ account });
        if (user.scopes.indexOf(scope) === -1) {
            throw new Error('forbidden: cannot publish package using ' + scope);
        }
        const attachment = pkg._attachments[filename];
        const tarballBuffer = Buffer.from(attachment.data, 'base64');
        if (tarballBuffer.length !== attachment.length) {
            throw new Error(`size_wrong: Attachment size ${attachment.length} not match download size ${tarballBuffer.length}`);
        }
        const shasum = this.createShasumCode(tarballBuffer);
        if (pkg.versions[version].dist) {
            pkg.versions[version].dist.tarball = this.configs.registryHost + '/download/' + filename;
            if (pkg.versions[version].dist.shasum !== shasum) {
                throw new Error(`shasum_wrong: Attachment shasum ${shasum} not match download size ${pkg.versions[version].dist.shasum}`);
            }
        }
        let packageId, firstTime = false;
        const packages = await this.getSinglePackageByPathname(name);
        if (!packages) {
            const packageModel = await this.createNewPackage(scope, alias, name);
            packageId = packageModel.id;
            firstTime = true;
        }
        else {
            packageId = packages.id;
        }
        const sysMaintainers = await MaintainerService.getMaintainersByPid(packageId);
        if (!firstTime) {
            if (!MaintainerService.checkMaintainerAllow(account, sysMaintainers)) {
                throw new Error('you have no right to publish package with ' + name);
            }
        }
        else {
            await MaintainerService.createNewMaintainer(account, packageId);
        }
        const _versions = await VersionService.getVersionsByPid(packageId);
        if (!VersionService.checkVersionAllow(version, _versions.map(ver => ver.name))) {
            throw new Error('forbidden: cannot publish pre-existing version: ' + version);
        }
        if (pkg.versions[version].dist) {
            pkg.versions[version].dist.size = attachment.length;
        }
        const _package = pkg.versions[version];
        _package.author = account;
        if (_package.scripts)
            delete _package.scripts;
        if (_package.readmeFilename)
            delete _package.readmeFilename;
        const versionModel = await VersionService.createNewVersion({
            pid: packageId,
            name: version,
            description: pkg.description,
            account,
            shasum,
            tarball: filename,
            size: attachment.length,
            package: JSON.stringify(_package),
            rev: uuid()
        });
        const vid = versionModel.id;
        const tags = [];
        for (var t in distTags)
            tags.push([t, vid]);
        if (!distTags.latest) {
            const latest = await TagServer.getChunksByPidAndName(packageId, 'latest');
            if (!latest.length) {
                tags.push(['latest', vid]);
            }
        }
        for (let i = 0; i < tags.length; i++) {
            await TagServer.createNewTag(packageId, tags[i][0], tags[i][1]);
        }
        await fse.ensureDir(path.dirname(tarballPath));
        fs.writeFileSync(tarballPath, tarballBuffer);
        await this.updateModifiedTime(packageId);
        await this.updatePackageCache(packageId);
    }
    async updateModifiedTime(pid) {
        return await this.ctx.dbo.package.update({
            mtime: new Date(),
        }, {
            where: {
                pid
            }
        });
    }
}
exports.default = PackageService;
