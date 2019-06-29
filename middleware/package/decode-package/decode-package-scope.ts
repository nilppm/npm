import { Context } from '@nelts/nelts';
export default async function decodePackageWithScope(ctx: Context, next: Function) {
  const scope = decodeURIComponent(ctx.params.scope);
  ctx.pkg = { pathname: `@${scope}`, version: null };
  await next();
}