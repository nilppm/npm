import { NPMContext } from '../../../index';
export default async function decodePackageWithPkgnameAndVersion(ctx: NPMContext, next: Function) {
  ctx.pkg = { pathname: ctx.params.pkgname, version: ctx.params.version };
  await next();
}