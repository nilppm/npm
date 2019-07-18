import { Model, DataTypes, Sequelize } from 'sequelize';

export default class UserTableModel extends Model {
  public id: number;
  public account: string;
  public name: string;
  public email: string;
  public avatar: string;
  public scopes: string;
  public extra: string;

  public static installer(sequelize: Sequelize) {
    UserTableModel.init({
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      account: {
        type: DataTypes.STRING(40),
        unique: 'uq_account',
      },
      name: DataTypes.STRING(10),
      email: DataTypes.STRING(255),
      avatar: DataTypes.TEXT,
      scopes: DataTypes.TEXT,
      extra: DataTypes.TEXT,
    }, {
      tableName: 'user',
      sequelize,
      createdAt: 'ctime',
      updatedAt: 'mtime',
      charset: 'utf8',
      collate: 'utf8_general_ci',
      indexes: [
        {
          name: 'idx_account',
          unique: true,
          fields: ['account']
        }
      ]
    });
  }
}