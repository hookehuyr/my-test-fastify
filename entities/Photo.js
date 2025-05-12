/*
 * @Date: 2025-05-11 21:24:37
 * @LastEditors: hookehuyr hookehuyr@gmail.com
 * @LastEditTime: 2025-05-12 23:42:41
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
    },
    relations: {
        metadata: {
            target: 'PhotoMetadata',
            type: 'one-to-one',
            joinColumn: true, // 表示该关系在目标实体中是被控制的一方
            cascade: true, // 当保存或删除Photo时，自动保存或删除关联的PhotoMetadata
            /**
             * 注意：
             * 如果你使用了cascade选项，你需要确保你不会在查询中使用join选项，因为这样会导致重复数据。
             * 如果你需要在查询中使用join选项，你应该使用leftJoinAndSelect或leftJoinAndMap选项。
             */
            inverseSide: 'photo'
        }
    }
})
