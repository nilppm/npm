"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class VersionTableModel extends sequelize_1.Model {
    static installer(sequelize) {
        VersionTableModel.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            pid: sequelize_1.DataTypes.INTEGER,
            name: sequelize_1.DataTypes.STRING(50),
            description: sequelize_1.DataTypes.TEXT,
            account: sequelize_1.DataTypes.STRING(100),
            shasum: sequelize_1.DataTypes.STRING(100),
            tarball: sequelize_1.DataTypes.STRING(255),
            size: sequelize_1.DataTypes.INTEGER,
            package: sequelize_1.DataTypes.TEXT,
            rev: sequelize_1.DataTypes.STRING(255),
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
exports.default = VersionTableModel;
