/*
 * @Date: 2025-05-07 14:09:40
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-07 14:09:42
 * @FilePath: /my-test-fastify/entities/CartItem.js
 * @Description: 文件描述
 */
'use strict'

const { EntitySchema } = require('typeorm')

/**
 * CartItem实体类
 * 映射cart_items表的结构和关系
 */
module.exports = new EntitySchema({
    name: 'CartItem',
    tableName: 'cart_items',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: 'increment'
        },
        quantity: {
            type: 'int',
            default: 1
        },
        created_at: {
            type: 'timestamp',
            default: () => 'CURRENT_TIMESTAMP'
        }
    },
    relations: {
        user: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: {
                name: 'user_id'
            },
            onDelete: 'CASCADE'
        },
        product: {
            type: 'many-to-one',
            target: 'Product',
            joinColumn: {
                name: 'product_id'
            },
            onDelete: 'CASCADE'
        }
    }
})
