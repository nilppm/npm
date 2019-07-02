"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = async function UserLoginMiddleware(ctx, next) {
    const header = ctx.request.header;
    const authorization = header.authorization;
    if (!authorization)
        return NotLogined(ctx);
    const codes = authorization.split(' ');
    if (codes.length !== 2)
        return NotLogined(ctx);
    const code = codes[1];
    const account = await ctx.redis.get(':user:expire:' + code);
    if (!account)
        return NotLogined(ctx);
    ctx.account = account;
    await next();
};
function NotLogined(ctx) {
    ctx.status = 401;
    throw new Error('Unauthorized, please login using `cpm login`');
}
