import { Model, Sequelize } from 'sequelize';
export default class PackageTableModel extends Model {
    id: number;
    scope: string;
    name: string;
    pathname: string;
    ctime: Date;
    mtime: Date;
    static installer(sequelize: Sequelize): void;
}
