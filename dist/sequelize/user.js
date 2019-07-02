"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class UserTableModel extends sequelize_1.Model {
    static installer(sequelize) {
        UserTableModel.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },
            account: {
                type: sequelize_1.DataTypes.STRING(40),
                unique: 'uq_account',
            },
            name: sequelize_1.DataTypes.STRING(10),
            email: sequelize_1.DataTypes.STRING(255),
            avatar: sequelize_1.DataTypes.TEXT,
            scopes: sequelize_1.DataTypes.TEXT,
            extra: sequelize_1.DataTypes.TEXT,
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
exports.default = UserTableModel;
