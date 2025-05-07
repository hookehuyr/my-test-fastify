/*
 * @Date: 2025-05-07 14:09:48
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-07 14:09:50
 * @FilePath: /my-test-fastify/entities/Order.js
 * @Description: 文件描述
 */
'use strict'

const { EntitySchema } = require('typeorm')

/**
 * Order实体类
 * 映射orders表的结构和关系
 */
module.exports = new EntitySchema({
    name: 'Order',
    tableName: 'orders',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: 'increment'
        },
        total_amount: {
            type: 'decimal',
            precision: 10,
            scale: 2
        },
        status: {
            type: 'enum',
            enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
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
        orderItems: {
            type: 'one-to-many',
            target: 'OrderItem',
            inverseSide: 'order'
        }
    }
})
