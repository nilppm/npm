"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class PackageTableModel extends sequelize_1.Model {
    static installer(sequelize) {
        PackageTableModel.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            scope: {
                type: sequelize_1.DataTypes.STRING(100),
                unique: 'uq_scope_alias',
            },
            name: {
                type: sequelize_1.DataTypes.STRING(100),
                unique: 'uq_scope_alias',
                allowNull: false,
            },
            pathname: {
                type: sequelize_1.DataTypes.STRING(200),
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
exports.default = PackageTableModel;
