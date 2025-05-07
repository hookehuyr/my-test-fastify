/*
 * @Date: 2025-05-07 14:09:48
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-07 15:50:22
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
        /**
         * 与用户的多对一关系
         * 一个用户可以有多个订单
         * 一个订单只能属于一个用户
         */
        user: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: {
                name: 'user_id'
            },
            onDelete: 'CASCADE'
        },
        /**
         * 与订单详情的一对多关系
         * 一个订单可以有多个订单详情
         * 一个订单详情只能属于一个订单
         */
        orderItems: {
            type: 'one-to-many',
            target: 'OrderItem',
            inverseSide: 'order'
        }
    }
})
