import { Model, Sequelize } from 'sequelize';
export default class VersionTableModel extends Model {
    id: number;
    pid: number;
    name: string;
    description: string;
    account: string;
    shasum: string;
    tarball: string;
    size: number;
    package: string;
    rev: string;
    ctime: Date;
    static installer(sequelize: Sequelize): void;
}
