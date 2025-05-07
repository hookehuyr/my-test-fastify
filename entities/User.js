/*
 * @Date: 2025-05-07 14:09:24
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-07 14:09:26
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
    name: 'User',
    tableName: 'users',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: 'increment'
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
    relations: {
        orders: {
            type: 'one-to-many',
            target: 'Order',
            inverseSide: 'user'
        },
        cartItems: {
            type: 'one-to-many',
            target: 'CartItem',
            inverseSide: 'user'
        }
    }
})
