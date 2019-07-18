import { Context } from '@nelts/nelts';
export default async function LoggerError(ctx: Context, next: Function) {
  ctx.on('error', (err: Error) => console.error(err));
  await next();
}