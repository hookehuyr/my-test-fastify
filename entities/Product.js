/*
 * @Date: 2025-05-07 14:09:32
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-07 15:35:58
 * @FilePath: /my-test-fastify/entities/Product.js
 * @Description: 文件描述
 */
'use strict'

const { EntitySchema } = require('typeorm')

/**
 * Product实体类
 * 映射products表的结构和关系
 */
module.exports = new EntitySchema({
    name: 'Product',
    tableName: 'products',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: 'increment'
        },
        name: {
            type: 'varchar',
            length: 100
        },
        description: {
            type: 'text',
            nullable: true
        },
        price: {
            type: 'decimal', // 使用decimal类型存储价格
            precision: 10, // 总位数
            scale: 2 // 小数位数
        },
        stock: {
            type: 'int',
            default: 0
        },
        created_at: {
            type: 'timestamp',
            default: () => 'CURRENT_TIMESTAMP'
        }
    },
    relations: {
        cartItems: {
            type: 'one-to-many',
            target: 'CartItem',
            inverseSide: 'product'
        },
        orderItems: {
            type: 'one-to-many',
            target: 'OrderItem',
            inverseSide: 'product'
        }
    }
})
