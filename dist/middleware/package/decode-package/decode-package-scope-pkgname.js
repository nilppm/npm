"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function decodePackageWithScopeAndPkgname(ctx, next) {
    const scope = decodeURIComponent(ctx.params.scope);
    const pkgname = ctx.params.pkgname;
    if (scope.indexOf('/') > 0) {
        ctx.pkg = { pathname: `@${scope}`, version: pkgname };
    }
    else {
        ctx.pkg = { pathname: `@${scope}/${pkgname}`, version: null };
    }
    await next();
}
exports.default = decodePackageWithScopeAndPkgname;
