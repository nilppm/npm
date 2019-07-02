import { Model, Sequelize } from 'sequelize';
export default class MaintainerTableModel extends Model {
    id: number;
    account: string;
    pid: number;
    static installer(sequelize: Sequelize): void;
}
