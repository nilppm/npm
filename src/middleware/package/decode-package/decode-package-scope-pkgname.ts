import { Context } from '@nelts/nelts';
export default async function decodePackageWithScopeAndPkgname(ctx: Context, next: Function) {
  const scope = decodeURIComponent(ctx.params.scope);
  const pkgname = ctx.params.pkgname;
  if (scope.indexOf('/') > 0) {
    ctx.pkg = { pathname: `@${scope}`, version: pkgname };
  } else {
    ctx.pkg = { pathname: `@${scope}/${pkgname}`, version: null };
  }
  await next();
}