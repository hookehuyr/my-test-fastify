/**
 * TypeORM数据库插件模块
 *
 * @module plugins/mysql
 * @description 提供TypeORM数据库连接和实体管理功能
 *
 * @requires fastify-plugin
 * @requires typeorm
 * @requires reflect-metadata
 */

'use strict'

// 确保在使用TypeORM之前已经加载了reflect-metadata
require('reflect-metadata')
const fp = require('fastify-plugin')
// 导入TypeORM库中的DataSource类
const { DataSource } = require('typeorm')

module.exports = fp(async function (fastify, opts) {
    const AppDataSource = new DataSource({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'huyirui520',
        database: 'ecommerce',
        synchronize: true, // 自动同步数据库结构
        logging: false,
        entities: [
            require('../entities/Product'),
            require('../entities/Order'),
            require('../entities/OrderItem'),
            require('../entities/CartItem'),
            require('../entities/User')
        ]
    })

    // 初始化数据源
    await AppDataSource.initialize()
    // 将数据源装饰到 fastify 实例上
    fastify.decorate('orm', AppDataSource)
})
