/*
 * @Date: 2025-05-07 14:09:24
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-07 15:32:59
 * @FilePath: /my-test-fastify/entities/User.js
 * @Description: 文件描述
 */
'use strict'

const { EntitySchema } = require('typeorm')

/**
 * User实体类
 * 映射users表的结构和关系
 */
module.exports = new EntitySchema({
    name: 'User', // 实体名称
    tableName: 'users', // 映射的数据库表名
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: 'increment' // 自增主键
        },
        username: {
            type: 'varchar',
            length: 50,
            unique: true
        },
        password: {
            type: 'varchar',
            length: 255
        },
        email: {
            type: 'varchar',
            length: 100,
            unique: true
        },
        created_at: {
            type: 'timestamp',
            default: () => 'CURRENT_TIMESTAMP'
        }
    },
    relations: { // 定义实体之间的关系
        // orders 是关联的属性名称, target是关联的实体类名, inverseSide是反向关系的名称
        // 比如在业务逻辑中,可以查询出该用户关联的订单, relations: ['orders'] 它是个查询条件
        orders: { // 一个用户可以有多个订单
            type: 'one-to-many',
            target: 'Order',
            inverseSide: 'user'
        },
        cartItems: { // 一个用户可以有多个购物车项
            type: 'one-to-many',
            target: 'CartItem',
            inverseSide: 'user'
        }
    }
})
