/*
 * @Date: 2025-05-07 14:09:56
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-07 14:09:57
 * @FilePath: /my-test-fastify/entities/OrderItem.js
 * @Description: 文件描述
 */
'use strict'

const { EntitySchema } = require('typeorm')

/**
 * OrderItem实体类
 * 映射order_items表的结构和关系
 */
module.exports = new EntitySchema({
    name: 'OrderItem',
    tableName: 'order_items',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: 'increment'
        },
        quantity: {
            type: 'int'
        },
        price: {
            type: 'decimal',
            precision: 10,
            scale: 2
        }
    },
    relations: {
        order: {
            type: 'many-to-one',
            target: 'Order',
            joinColumn: {
                name: 'order_id'
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
