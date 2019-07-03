import { Model, DataTypes, Sequelize } from 'sequelize';

export default class VersionTableModel extends Model {
  public id: number;
  public pid: number;
  public name: string;
  public description: string;
  public account: string;
  public shasum: string;
  public tarball: string;
  public size: number;
  public package: string;
  public rev: string;
  public ctime: Date;
  public static installer(sequelize: Sequelize) {
    VersionTableModel.init({
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      pid: DataTypes.INTEGER,
      name: DataTypes.STRING(50),
      description: DataTypes.TEXT,
      account: DataTypes.STRING(100),
      shasum: DataTypes.STRING(100),
      tarball: DataTypes.STRING(255),
      size: DataTypes.INTEGER,
      package: DataTypes.TEXT,
      rev: DataTypes.STRING(255),
    }, {
      tableName: 'version',
      sequelize,
      createdAt: 'ctime',
      updatedAt: 'mtime',
      charset: 'utf8',
      collate: 'utf8_general_ci',
      indexes: [
        {
          name: 'idx_rev',
          unique: true,
          fields: ['rev']
        },
        {
          name: 'uq_pid_name',
          unique: true,
          fields: ['pid', 'name']
        }
      ],
    });
  }
}