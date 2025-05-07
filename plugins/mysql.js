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

require('reflect-metadata')
const fp = require('fastify-plugin')
const { DataSource } = require('typeorm')

module.exports = fp(async function (fastify, opts) {
    const AppDataSource = new DataSource({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'huyirui520',
        database: 'ecommerce',
        synchronize: true,
        logging: false,
        entities: [
            require('../entities/User'),
            require('../entities/Product'),
            require('../entities/CartItem'),
            require('../entities/Order'),
            require('../entities/OrderItem')
        ]
    })

    await AppDataSource.initialize()
    fastify.decorate('orm', AppDataSource)
})
