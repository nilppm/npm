import { NPMContext } from '../../../index';
export default async function decodePackageWithScopePkgnameAndVersion(ctx: NPMContext, next: Function) {
  const scope = ctx.params.scope;
  const pkgname = ctx.params.pkgname;
  const version = ctx.params.version;
  ctx.pkg = { pathname: `@${scope}/${pkgname}`, version };
  await next();
}