import { Model, Sequelize } from 'sequelize';
export default class UserTableModel extends Model {
    id: number;
    account: string;
    name: string;
    email: string;
    avatar: string;
    scopes: string;
    extra: string;
    static installer(sequelize: Sequelize): void;
}
