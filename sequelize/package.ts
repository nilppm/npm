import { Model, DataTypes, Sequelize } from 'sequelize';

export default class PackageTableModel extends Model {
  public id: number;
  public scope: string;
  public name: string;
  public pathname: string;
  public ctime: Date;
  public mtime: Date;

  public static installer(sequelize: Sequelize) {
    PackageTableModel.init({
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      scope: {
        type: DataTypes.STRING(100),
        unique: 'uq_scope_alias',
      },
      name: {
        type: DataTypes.STRING(100),
        unique: 'uq_scope_alias',
        allowNull: false,
      },
      pathname: {
        type: DataTypes.STRING(200),
        unique: true,
        allowNull: false,
      },
    }, {
      tableName: 'package',
      sequelize,
      createdAt: 'ctime',
      updatedAt: 'mtime',
      charset: 'utf8',
      collate: 'utf8_general_ci',
      indexes: [
        {
          name: 'idx_pathname',
          unique: true,
          fields: ['pathname']
        }
      ]
    });
  }
}