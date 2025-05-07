/*
 * @Date: 2025-05-07 14:09:56
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-07 15:48:20
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
            joinColumn: { // 外键列的名称
                name: 'order_id'
            },
            onDelete: 'CASCADE' // 删除订单时，级联删除订单项
        },
        product: {
            type: 'many-to-one',
            target: 'Product',
            joinColumn: { // 外键列的名称
                name: 'product_id'
            },
            onDelete: 'CASCADE'
        }
    }
})
