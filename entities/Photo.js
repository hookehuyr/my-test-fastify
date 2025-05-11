/*
 * @Date: 2025-05-11 21:24:37
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-11 22:28:54
 * @FilePath: /my-test-fastify/entities/Photo.js
 * @Description: 文件描述
 */
'use strict'

const { EntitySchema } = require('typeorm')
/**
 * Product实体类
 * 映射products表的结构和关系
 */
module.exports = new EntitySchema({
    name: 'Photo',
    tableName: 'photos',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: 'increment'
        },
        name: {
            type: 'varchar',
            length: 100,
            required: true
        },
        filename: {
            type: 'varchar',
            length: 255,
            required: true
        },
        description: {
            type: 'text',
            nullable: true
        },
        views: {
            type: 'double',
            default: 0
        },
        isPublished: {
            type: 'boolean',
            default: false
        }
    }
})
