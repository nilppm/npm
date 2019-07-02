declare const _default: {
    cookie: string[];
    sequelize: {
        database: string;
        username: string;
        password: string;
        options: {
            dialect: string;
            host: string;
            pool: {
                max: number;
                min: number;
            };
        };
    };
    redis: string;
    redis_prefix: string;
    loginExpire: number;
    officialNpmRegistry: string;
    officialNpmReplicate: string;
    sourceNpmRegistry: string;
    registryHost: string;
    nfs: string;
    fetchPackageRegistriesOrder: string[];
    scopes: string[];
    defaultEmailSuffix: string;
    admins: any[];
};
export default _default;
